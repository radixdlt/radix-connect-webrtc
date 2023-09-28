import { ConnectorClient } from '../connector-client'
import type { SignalingSubjectsType } from '../signaling/subjects'
import { SignalingSubjects } from '../signaling/subjects'
import { ConnectorClientSubjects } from '../subjects'
import type { WebRtcSubjectsType } from '../webrtc/subjects'
import { WebRtcSubjects } from '../webrtc/subjects'
import type { Dependencies, Status } from '../../_types'
import { filter, firstValueFrom, Subject } from 'rxjs'
import { delayAsync } from '../../test-utils/delay-async'
import { Logger } from 'tslog'
import { generateConnectionPassword } from '../helpers'
import { NodeWebRTC } from '../../dependencies/webrtc'
import { NodeWebSocket } from '../../dependencies/websocket'

describe('connector client', () => {
  let extensionLogger = new Logger({ name: 'extensionConnector', minLevel: 0 })
  let walletLogger = new Logger({ name: 'walletConnector', minLevel: 2 })
  let walletConnectorSubjects: ConnectorClientSubjects
  let extensionConnectorSubjects: ConnectorClientSubjects
  let extensionConnector: ConnectorClient
  let walletConnector: ConnectorClient
  let extensionWebRtcSubjects: WebRtcSubjectsType
  let walletWebRtcSubjects: WebRtcSubjectsType
  let extensionSignalingSubjects: SignalingSubjectsType
  const connectionPassword = generateConnectionPassword()
  if (connectionPassword.isErr()) {
    throw new Error('Could not generate random connection password')
  }
  const password = connectionPassword.value

  const waitForDataChannelStatus = (
    subjects: WebRtcSubjectsType,
    value: 'open' | 'closed',
  ) =>
    firstValueFrom(
      subjects.dataChannelStatusSubject.pipe(
        filter((status) => status === value),
      ),
    )

  const waitForSignalingServerStatus = (
    subjects: SignalingSubjectsType,
    value: Status,
  ) =>
    firstValueFrom(
      subjects.statusSubject.pipe(filter((status) => status === value)),
    )

  const dependencies: Dependencies = {
    WebRTC: NodeWebRTC(),
    WebSocket: NodeWebSocket(),
  }

  const createExtensionConnector = () => {
    extensionConnector = ConnectorClient({
      source: 'extension',
      target: 'wallet',
      logger: extensionLogger,
      isInitiator: false,
      subjects: extensionConnectorSubjects,
      createSignalingSubjects: () => extensionSignalingSubjects,
      createWebRtcSubjects: () => extensionWebRtcSubjects,
      dependencies,
    })
    extensionConnector.setConnectionConfig({
      signalingServerBaseUrl:
        'wss://signaling-server-dev.rdx-works-main.extratools.works',
    })
  }

  const createWalletConnector = () => {
    walletConnector = ConnectorClient({
      source: 'wallet',
      target: 'extension',
      // logger: walletLogger,
      subjects: walletConnectorSubjects,
      isInitiator: true,
      createWebRtcSubjects: () => walletWebRtcSubjects,
      dependencies,
    })
    walletConnector.setConnectionConfig({
      signalingServerBaseUrl:
        'wss://signaling-server-dev.rdx-works-main.extratools.works',
    })
  }

  beforeEach(async () => {
    if (!global.crypto) await delayAsync(1000)
    extensionLogger.settings.minLevel = 2
    walletLogger.settings.minLevel = 2

    walletConnectorSubjects = ConnectorClientSubjects()
    extensionConnectorSubjects = ConnectorClientSubjects()
    extensionWebRtcSubjects = WebRtcSubjects()
    extensionSignalingSubjects = SignalingSubjects()
    walletWebRtcSubjects = WebRtcSubjects()
  })

  afterEach(async () => {
    walletLogger.settings.minLevel = 3
    extensionLogger.settings.minLevel = 3
    extensionConnector?.destroy()
    walletConnector?.destroy()
    // wait for cleanup to finish
    await delayAsync(100)
  })

  it('should open data channel between two peers', async () => {
    createExtensionConnector()
    createWalletConnector()
    extensionConnector.setConnectionPassword(password)
    extensionConnector.connect()

    walletConnector.setConnectionPassword(password)
    walletConnector.connect()

    expect(
      await waitForDataChannelStatus(extensionWebRtcSubjects, 'open'),
    ).toBe('open')
  })

  it('should reconnect to SS if connection password is changed', async () => {
    createExtensionConnector()

    extensionConnector.setConnectionPassword(password)
    extensionConnector.connect()

    await waitForSignalingServerStatus(extensionSignalingSubjects, 'connected')

    await extensionConnector.generateConnectionPassword()

    await waitForSignalingServerStatus(
      extensionSignalingSubjects,
      'disconnected',
    )

    expect(
      await waitForSignalingServerStatus(
        extensionSignalingSubjects,
        'connected',
      ),
    ).toBe('connected')
  })

  it('should wait for connection password before connecting', async () => {
    createExtensionConnector()
    extensionConnector.connect()

    expect(
      await waitForSignalingServerStatus(
        extensionSignalingSubjects,
        'disconnected',
      ),
    ).toBe('disconnected')

    extensionConnector.setConnectionPassword(password)

    expect(
      await waitForSignalingServerStatus(
        extensionSignalingSubjects,
        'connected',
      ),
    ).toBe('connected')
  })

  it('should fail to send a message if data channel is closed', async () => {
    createExtensionConnector()
    createWalletConnector()

    const result = await extensionConnector.sendMessage({ foo: 'bar' })

    expect(result.isErr() && result.error.reason).toBe('notConnected')

    extensionConnector.setConnectionPassword(password)
    extensionConnector.connect()

    walletConnector.setConnectionPassword(password)
    walletConnector.connect()

    await waitForDataChannelStatus(extensionWebRtcSubjects, 'open')

    const result2 = await extensionConnector.sendMessage({ foo: 'bar' })

    expect(result2.isOk() && result2.value).toBe(undefined)
  })

  it('should open data channel and send message', async () => {
    createExtensionConnector()
    createWalletConnector()

    extensionConnector.setConnectionPassword(password)
    extensionConnector.connect()

    walletConnector.setConnectionPassword(password)
    walletConnector.connect()

    await waitForDataChannelStatus(extensionWebRtcSubjects, 'open')

    const messageEventSubject = new Subject<string>()

    await Promise.all([
      extensionConnector.sendMessage(
        { foo: 'bar' },
        { messageEventCallback: (event) => messageEventSubject.next(event) },
      ),
      firstValueFrom(
        messageEventSubject.pipe(filter((event) => event === 'messageSent')),
      ),
      firstValueFrom(
        extensionConnectorSubjects.onDataChannelMessageSubject.pipe(
          filter(
            (message) => message.packageType === 'receiveMessageConfirmation',
          ),
        ),
      ),
    ])
  })
})
