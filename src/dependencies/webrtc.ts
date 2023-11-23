// @ts-nocheck

export type WebRTC = {
  RTCIceCandidate: RTCIceCandidate
  RTCSessionDescription: RTCSessionDescription
  RTCPeerConnection: RTCPeerConnection
}

export const NodeWebRTC = (): Promise<WebRTC> => {
  console.log('process.env.CI', process.env.CI)
  return import(process.env.CI ? 'wrtc' : '@koush/wrtc').then((webRTC) => ({
    RTCIceCandidate: webRTC.RTCIceCandidate,
    RTCSessionDescription: webRTC.RTCSessionDescription,
    RTCPeerConnection: webRTC.RTCPeerConnection,
  }))
}
