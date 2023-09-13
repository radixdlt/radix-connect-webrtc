// @ts-nocheck
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from '@koush/wrtc'

export const polyfillWebRTC = () => {
  if (!globalThis.RTCPeerConnection) {
    globalThis.RTCPeerConnection = RTCPeerConnection
    globalThis.RTCIceCandidate = RTCIceCandidate
    globalThis.RTCSessionDescription = RTCSessionDescription
  } else if (typeof global !== 'undefined' && !global.RTCPeerConnection) {
    global.RTCPeerConnection = RTCPeerConnection
    global.RTCIceCandidate = RTCIceCandidate
    global.RTCSessionDescription = RTCSessionDescription
  }
}
