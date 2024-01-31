import { SecretsClient } from './secrets-client'
import { SignalingClient } from './signaling/signaling-client'
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  finalize,
  firstValueFrom,
  iif,
  map,
  merge,
  Subscription,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs'
import { WebRtcClient } from './webrtc/webrtc-client'
import type { MessageSources } from '@radixdlt/radix-connect-schemas'
import type { Logger } from 'tslog'
import type { WebRtcSubjectsType } from './webrtc/subjects'
import { WebRtcSubjects } from './webrtc/subjects'
import type { SignalingSubjectsType } from './signaling/subjects'
import { SignalingSubjects } from './signaling/subjects'
import { errAsync, ResultAsync } from 'neverthrow'
import { errorIdentity } from '../utils/error-identity'
import { sendMessageOverDataChannelAndWaitForConfirmation } from './webrtc/helpers/send-message-over-data-channel-and-wait-for-confirmation'
import { ConnectorClientSubjects } from './subjects'
import type { ConnectionConfig, MessageErrorReasons, Secrets } from '../_types'
import { BrowserWebRTC, type WebRTC } from '../dependencies/webrtc'
import { NodeWebSocket, type WebSocket } from '../dependencies/websocket'

export type ConnectorClient = ReturnType<typeof ConnectorClient>

export const ConnectorClient = (input: {
  target: MessageSources
  source: MessageSources
  isInitiator: boolean
  logger?: Logger<unknown>
  createWebRtcSubjects?: () => WebRtcSubjectsType
  createSignalingSubjects?: () => SignalingSubjectsType
  subjects?: ConnectorClientSubjects
  dependencies?: Partial<{ WebRTC: WebRTC; WebSocket: WebSocket }>
  negotiationTimeout?: number
}) => {
  const logger = input.logger
  logger?.debug(`🔌✨ connector client initiated`)

  const subjects = input.subjects || ConnectorClientSubjects()
  const shouldConnectSubject = subjects.shouldConnectSubject
  const connected = subjects.connected
  const triggerRestartSubject = subjects.triggerRestartSubject
  const onDataChannelMessageSubject = subjects.onDataChannelMessageSubject
  const onMessage = subjects.onMessage
  const sendMessageOverDataChannelSubject =
    subjects.sendMessageOverDataChannelSubject

  const webRTCDependency = input.dependencies?.WebRTC ?? BrowserWebRTC()
  const websocketDependency = input.dependencies?.WebSocket ?? NodeWebSocket()
  const resolvedDependencies = {
    WebRTC: webRTCDependency,
    WebSocket: websocketDependency,
  }

  const createWebRtcSubjects =
    input.createWebRtcSubjects || (() => WebRtcSubjects())

  const createSignalingSubjects =
    input.createSignalingSubjects || (() => SignalingSubjects())

  const secretsClient = SecretsClient({ logger })

  const triggerRestart$ = triggerRestartSubject.pipe(
    withLatestFrom(shouldConnectSubject),
    map(([, shouldConnect]) => shouldConnect),
    tap(() => logger?.debug(`🔌🔄 restarting connector client`)),
  )
  const triggerConnection$ = merge(
    shouldConnectSubject.pipe(
      distinctUntilChanged((oldValue, newValue) => oldValue === newValue),
    ),
    triggerRestart$,
  )

  const subscriptions = new Subscription()

  const connection$ = combineLatest([
    secretsClient.secrets$.pipe(
      filter((secrets): secrets is Secrets => !!secrets),
    ),
    subjects.connectionConfig
      .asObservable()
      .pipe(
        filter(
          (connectionConfig): connectionConfig is ConnectionConfig =>
            !!connectionConfig,
        ),
      ),
  ]).pipe(
    switchMap(([secrets, connectionConfig]) => {
      const signalingClient = SignalingClient({
        baseUrl: connectionConfig.signalingServerBaseUrl,
        target: input.target,
        source: input.source,
        logger,
        subjects: createSignalingSubjects(),
        secrets,
        restart: () => triggerRestartSubject.next(),
        dependencies: resolvedDependencies,
      })

      const webRtcClient = WebRtcClient({
        iceTransportPolicy: connectionConfig.iceTransportPolicy,
        dependencies: resolvedDependencies,
        peerConnectionConfig: {
          iceServers: [
            {
              urls: 'stun:stun.l.google.com:19302',
            },
            {
              urls: 'stun:stun1.l.google.com:19302',
            },
            {
              urls: 'stun:stun2.l.google.com:19302',
            },
            {
              urls: 'stun:stun3.l.google.com:19302',
            },
            {
              urls: 'stun:stun4.l.google.com:19302',
            },
            ...(connectionConfig.turnServers || []),
          ],
        },
        dataChannelConfig: {
          negotiated: true,
          id: 0,
          ordered: true,
        },
        chunkSize: 11_500,
        confirmationTimeout: 10_000,
        logger,
        shouldCreateOffer: input.isInitiator,
        subjects: createWebRtcSubjects(),
        onDataChannelMessageSubject,
        sendMessageOverDataChannelSubject,
        onMessage,
        signalingClient,
        source: input.source,
        restart: () => triggerRestartSubject.next(),
        negotiationTimeout: input.negotiationTimeout ?? 10_000,
      })

      const destroy = () => {
        signalingClient.destroy()
        webRtcClient.destroy()
      }

      return webRtcClient.dataChannelClient.subjects.dataChannelStatusSubject.pipe(
        tap((status) => connected.next(status === 'open')),
        finalize(() => {
          connected.next(false)
          return destroy()
        }),
      )
    }),
  )

  subscriptions.add(
    triggerConnection$
      .pipe(
        switchMap((shouldConnect) =>
          iif(() => !!shouldConnect, connection$, []),
        ),
      )
      .subscribe(),
  )

  return {
    connected$: connected.asObservable(),
    connected: () =>
      ResultAsync.fromPromise(
        firstValueFrom(connected.pipe(filter((value) => value))),
        errorIdentity,
      ),
    setConnectionPassword: (password: Buffer) =>
      secretsClient.deriveSecretsFromPassword(password),
    connectionPassword$: secretsClient.secrets$.pipe(
      map((secrets) => secrets?.encryptionKey),
    ),
    setConnectionConfig: (config: ConnectionConfig) =>
      subjects.connectionConfig.next(config),
    generateConnectionPassword: () => secretsClient.generateConnectionSecrets(),
    connect: () => shouldConnectSubject.next(true),
    disconnect: () => shouldConnectSubject.next(false),
    shouldConnect$: shouldConnectSubject.asObservable(),
    restart: () => triggerRestartSubject.next(),
    sendMessage: (
      message: Record<string, any>,
      options?: Partial<{
        messageEventCallback: (event: 'messageSent') => void
        timeout: number
      }>,
    ): ResultAsync<
      undefined,
      {
        reason: MessageErrorReasons
        jsError?: Error
      }
    > => {
      if (!connected.getValue()) return errAsync({ reason: 'notConnected' })

      const defaultMessageEventCallback = () => {}

      const messageEventCallback =
        options?.messageEventCallback || defaultMessageEventCallback

      return sendMessageOverDataChannelAndWaitForConfirmation({
        message,
        sendMessageOverDataChannelSubject,
        onDataChannelMessageSubject,
        messageEventCallback,
        timeout: options?.timeout,
        chunkSize: 11_500,
      })
    },
    onMessage$: onMessage.asObservable(),
    destroy: () => {
      logger?.debug('🔌🧹 destroying connector client')
      subscriptions.unsubscribe()
    },
  }
}
