// @ts-nocheck
import webRTC from '@koush/wrtc'

export type WebRTC = {
  RTCIceCandidate: (typeof webRTC)['RTCIceCandidate']
  RTCSessionDescription: (typeof webRTC)['RTCSessionDescription']
  RTCPeerConnection: (typeof webRTC)['RTCPeerConnection']
}

export const NodeWebRTC = (): WebRTC => ({
  RTCIceCandidate: webRTC.RTCIceCandidate,
  RTCSessionDescription: webRTC.RTCSessionDescription,
  RTCPeerConnection: webRTC.RTCPeerConnection,
})
