type AConstructorTypeOf<A, T> = new (args: A) => T

export type WebRTC = {
  RTCIceCandidate: AConstructorTypeOf<RTCIceCandidateInit, RTCIceCandidate>
  RTCSessionDescription: AConstructorTypeOf<
    RTCSessionDescriptionInit,
    RTCSessionDescription
  >
  RTCPeerConnection: AConstructorTypeOf<RTCConfiguration, RTCPeerConnection>
}

export const BrowserWebRTC = (): WebRTC => ({
  RTCIceCandidate: RTCIceCandidate,
  RTCSessionDescription: RTCSessionDescription,
  RTCPeerConnection: RTCPeerConnection,
})
