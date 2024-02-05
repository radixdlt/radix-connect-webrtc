import type { SignalingClient } from '../signaling/signaling-client'
import type {
  Answer,
  MessageSources,
  Offer,
} from '@radixdlt/radix-connect-schemas'
import { ResultAsync } from 'neverthrow'
import { filter, mergeMap, Subscription, switchMap, tap } from 'rxjs'
import type { Logger } from 'tslog'
import { errorIdentity } from '../../utils/error-identity'
import type { WebRtcSubjectsType } from './subjects'

export const PeerConnectionClient = (input: {
  subjects: WebRtcSubjectsType
  peerConnection: RTCPeerConnection
  logger?: Logger<unknown>
  shouldCreateOffer: boolean
  source: MessageSources
  signalingClient: SignalingClient
  restart: () => void
}) => {
  const peerConnection = input.peerConnection
  const subjects = input.subjects
  const logger = input.logger
  const subscriptions = new Subscription()

  const signalingClient = input.signalingClient
  const onRemoteOffer$ = signalingClient.onOffer$

  subscriptions.add(
    signalingClient.onAnswer$
      .pipe(tap((value) => subjects.remoteAnswerSubject.next(value)))
      .subscribe(),
  )

  const onNegotiationNeeded = () => {
    if (input.shouldCreateOffer)
      subscriptions.add(
        signalingClient.remoteClientConnected$
          .pipe(
            switchMap(() =>
              createOffer()
                .andThen(setLocalDescription)
                .map(() => peerConnection.localDescription!)
                .map(({ sdp }) => ({
                  method: 'offer' as Offer['method'],
                  payload: { sdp },
                  source: input.source,
                }))
                .map((offer) => subjects.offerSubject.next(offer)),
            ),
          )
          .subscribe(),
      )
  }

  const onSignalingStateChange = () => {
    logger?.debug(`🕸🏛 signalingState: ${peerConnection.signalingState}`)
    subjects.onSignalingStateChangeSubject.next(peerConnection.signalingState)
  }

  const onIceGatheringStateChange = () => {
    logger?.debug(
      `🕸🧊 onIceGatheringState: ${peerConnection.iceGatheringState}`,
    )
  }

  const onPeerConnectionState = () => {
    logger?.debug(
      `🕸🧊 onPeerConnectionStateChange: ${peerConnection.connectionState}`,
    )
    subjects.peerConnectionStateSubject.next(peerConnection.connectionState)
  }

  peerConnection.onnegotiationneeded = onNegotiationNeeded
  peerConnection.onsignalingstatechange = onSignalingStateChange
  peerConnection.onicegatheringstatechange = onIceGatheringStateChange
  peerConnection.onconnectionstatechange = onPeerConnectionState

  const setLocalDescription = (description: RTCSessionDescriptionInit) =>
    ResultAsync.fromPromise(
      peerConnection.setLocalDescription(description),
      errorIdentity,
    )
      .map(() => {
        logger?.debug('🕸✅ localDescriptionSuccess')
        subjects.onLocalDescriptionSuccessSubject.next(true)
        return peerConnection.localDescription!
      })
      .mapErr((err) => {
        logger?.debug('🕸❌ localDescriptionError')
        return err
      })

  const setRemoteDescription = (description: RTCSessionDescriptionInit) =>
    ResultAsync.fromPromise(
      peerConnection.setRemoteDescription(description),
      errorIdentity,
    )
      .map(() => {
        logger?.debug('🕸✅ setRemoteDescriptionSuccess')
        subjects.onRemoteDescriptionSuccessSubject.next(true)
      })
      .mapErr((error) => {
        logger?.debug(`🕸❌ setRemoteDescriptionError: ${error}`)
      })

  const createAnswer = () =>
    ResultAsync.fromPromise(peerConnection.createAnswer(), errorIdentity)

  const createOffer = () =>
    ResultAsync.fromPromise(peerConnection.createOffer(), errorIdentity)

  subscriptions.add(
    onRemoteOffer$
      .pipe(
        switchMap((offer) =>
          setRemoteDescription(offer)
            .andThen(createAnswer)
            .andThen(setLocalDescription)
            .map(({ sdp }) => ({
              method: 'answer' as Answer['method'],
              payload: { sdp },
              source: input.source,
            }))
            .map((answer) => subjects.answerSubject.next(answer)),
        ),
      )
      .subscribe(),
  )

  subscriptions.add(
    subjects.onLocalDescriptionSuccessSubject
      .pipe(
        filter((value) => value),
        switchMap(() =>
          subjects.remoteAnswerSubject.pipe(
            filter(
              (session): session is RTCSessionDescriptionInit => !!session,
            ),
            mergeMap(setRemoteDescription),
          ),
        ),
      )
      .subscribe(),
  )

  return {
    destroy: () => {
      peerConnection.removeEventListener(
        'signalingstatechange',
        onSignalingStateChange,
      )
      peerConnection.removeEventListener(
        'onnegotiationneeded',
        onNegotiationNeeded,
      )
      peerConnection.close()
      subscriptions.unsubscribe()
    },
  }
}
