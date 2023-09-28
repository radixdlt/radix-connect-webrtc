import type { Answer, Offer } from '@radixdlt/radix-connect-schemas'
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs'
import type { IceCandidateMessage } from '../../_types'

export type WebRtcSubjectsType = ReturnType<typeof WebRtcSubjects>

export const WebRtcSubjects = () => ({
  onNegotiationNeededSubject: new Subject<void>(),
  onIceCandidateSubject: new Subject<RTCIceCandidate>(),
  iceCandidatesSubject: new BehaviorSubject<IceCandidateMessage[]>([]),
  onRemoteIceCandidateSubject: new Subject<RTCIceCandidate>(),
  remoteIceCandidatesSubject: new BehaviorSubject<RTCIceCandidate[]>([]),
  offerSubject: new ReplaySubject<
    Pick<Offer, 'method' | 'payload' | 'source'>
  >(),
  answerSubject: new ReplaySubject<
    Pick<Answer, 'method' | 'payload' | 'source'>
  >(),
  onRemoteAnswerSubject: new Subject<void>(),
  onSignalingStateChangeSubject: new Subject<RTCSignalingState>(),
  dataChannelStatusSubject: new BehaviorSubject<'open' | 'closed'>('closed'),
  iceConnectionStateSubject: new Subject<RTCIceConnectionState>(),
})
