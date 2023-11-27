// @ts-nocheck
import webRTC from '@koush/wrtc'

type AConstructorTypeOf<A, T> = new (args: A) => T

export type WebRTC = {
  RTCIceCandidate: AConstructorTypeOf<RTCIceCandidateInit, RTCIceCandidate>
  RTCSessionDescription: AConstructorTypeOf<
    RTCSessionDescriptionInit,
    RTCSessionDescription
  >
  RTCPeerConnection: AConstructorTypeOf<RTCConfiguration, RTCPeerConnection>
}

export const NodeWebRTC = (): WebRTC => ({
  RTCIceCandidate: webRTC.RTCIceCandidate,
  RTCSessionDescription: webRTC.RTCSessionDescription,
  RTCPeerConnection: webRTC.RTCPeerConnection,
})

export const BrowserWebRTC = (): WebRTC => ({
  RTCIceCandidate: RTCIceCandidate,
  RTCSessionDescription: RTCSessionDescription,
  RTCPeerConnection: RTCPeerConnection,
})
