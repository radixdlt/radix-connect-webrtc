import type {
  IceCandidate,
  MessageSources,
} from '@radixdlt/radix-connect-schemas'
import type { Logger } from 'tslog'
import {
  concatMap,
  filter,
  first,
  map,
  merge,
  mergeMap,
  scan,
  Subscription,
  tap,
} from 'rxjs'
import type { WebRtcSubjectsType } from './subjects'
import { ResultAsync } from 'neverthrow'
import { errorIdentity } from '../../utils/error-identity'
import type { IceCandidateMessage } from '../../_types'

export const cacheRemoteIceCandidates = (subjects: WebRtcSubjectsType) =>
  subjects.onRemoteIceCandidateSubject.pipe(
    scan((acc, curr) => [...acc, curr], [] as RTCIceCandidate[]),
    tap((iceCandidates) =>
      subjects.remoteIceCandidatesSubject.next(iceCandidates),
    ),
  )

export const IceCandidateClient = (input: {
  subjects: WebRtcSubjectsType
  peerConnection: RTCPeerConnection
  source: MessageSources
  logger?: Logger<unknown>
}) => {
  const subjects = input.subjects
  const peerConnection = input.peerConnection
  const logger = input.logger

  const onIcecandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) subjects.onIceCandidateSubject.next(event.candidate)
  }
  const onIceconnectionStateChange = () => {
    logger?.debug(
      `🕸🧊 iceConnectionState: ${peerConnection.iceConnectionState}`,
    )
    subjects.iceConnectionStateSubject.next(peerConnection.iceConnectionState)
  }

  peerConnection.onicecandidate = onIcecandidate
  peerConnection.oniceconnectionstatechange = onIceconnectionStateChange

  const addIceCandidate = (iceCandidate: RTCIceCandidate) =>
    ResultAsync.fromPromise(
      peerConnection.addIceCandidate(iceCandidate),
      errorIdentity,
    )
      .map(() => {
        logger?.trace(
          `🧊⬇️✅ addIceCandidateSuccess: ${iceCandidate.candidate}`,
        )
        return iceCandidate
      })
      .mapErr(() => {
        logger?.trace(`🧊⬇️❌ addIceCandidateError: ${iceCandidate.candidate}`)
        return iceCandidate
      })

  const subscriptions = new Subscription()

  const iceCandidate$ = subjects.onIceCandidateSubject.asObservable().pipe(
    map(({ candidate, sdpMid, sdpMLineIndex }) => ({
      candidate,
      sdpMid,
      sdpMLineIndex,
    })),
    filter(
      (iceCandidate): iceCandidate is IceCandidate['payload'] =>
        !!iceCandidate.candidate,
    ),
    map(
      (payload): IceCandidateMessage => ({
        method: 'iceCandidate' as IceCandidate['method'],
        payload,
        source: input.source,
      }),
    ),
  )

  const onRemoteDescriptionSuccess$ =
    subjects.onRemoteDescriptionSuccessSubject.pipe(
      filter((isSuccess) => isSuccess),
    )

  const onRemoteIceCandidate$ = merge(
    subjects.remoteIceCandidatesSubject.pipe(
      first(),
      mergeMap((iceCandidates) => iceCandidates),
    ),
    subjects.onRemoteIceCandidateSubject,
  )

  subscriptions.add(
    subjects.onRemoteIceCandidateSubject
      .pipe(
        scan((acc, curr) => [...acc, curr], [] as RTCIceCandidate[]),
        tap((iceCandidates) =>
          subjects.remoteIceCandidatesSubject.next(iceCandidates),
        ),
      )
      .subscribe(),
  )

  subscriptions.add(
    onRemoteDescriptionSuccess$
      .pipe(
        mergeMap(() => onRemoteIceCandidate$),
        concatMap(addIceCandidate),
      )
      .subscribe(),
  )

  return {
    iceCandidate$,
    destroy: () => {
      peerConnection.removeEventListener('icecandidate', onIcecandidate)
      peerConnection.removeEventListener(
        'iceconnectionstatechange',
        onIceconnectionStateChange,
      )
      subscriptions.unsubscribe()
    },
  }
}
