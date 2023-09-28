import {
  RTCIceCandidate,
  RTCSessionDescription,
  RTCPeerConnection,
  // @ts-ignore
} from '@koush/wrtc'

export type WebRTC = {
  RTCIceCandidate: typeof RTCIceCandidate
  RTCSessionDescription: typeof RTCSessionDescription
  RTCPeerConnection: typeof RTCPeerConnection
}

export const NodeWebRTC = (): WebRTC => ({
  RTCIceCandidate,
  RTCSessionDescription,
  RTCPeerConnection,
})
