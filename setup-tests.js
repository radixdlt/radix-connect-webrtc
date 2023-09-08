if (!globalThis.RTCPeerConnection) {
  globalThis.RTCPeerConnection = RTCPeerConnection
  globalThis.RTCIceCandidate = RTCIceCandidate
  globalThis.RTCSessionDescription = RTCSessionDescription
}
