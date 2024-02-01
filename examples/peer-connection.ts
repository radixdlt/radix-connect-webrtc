import { createLogger } from '../src/utils/logger'
// @ts-nocheck
import webRTC from '@koush/wrtc'
import type { WebRTC } from '../src/dependencies/webrtc'

const logger = createLogger(0)

const NodeWebRTC = () => ({
  RTCIceCandidate: webRTC.RTCIceCandidate,
  RTCSessionDescription: webRTC.RTCSessionDescription,
  RTCPeerConnection: webRTC.RTCPeerConnection,
})

const webrtc: WebRTC = NodeWebRTC()

const pc1 = new webrtc.RTCPeerConnection({
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    {
      urls: 'stun:stun2.l.google.com:19302',
    },
    {
      urls: 'stun:stun3.l.google.com:19302',
    },
    {
      urls: 'stun:stun4.l.google.com:19302',
    },
  ],
})

const dc1 = pc1.createDataChannel('test')

const pc2 = new webrtc.RTCPeerConnection({
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'stun:stun1.l.google.com:19302',
    },
    {
      urls: 'stun:stun2.l.google.com:19302',
    },
    {
      urls: 'stun:stun3.l.google.com:19302',
    },
    {
      urls: 'stun:stun4.l.google.com:19302',
    },
  ],
})

const dc2 = pc2.createDataChannel('test')

const pc1Candidates: any[] = []
const pc2Candidates: any[] = []

pc1.onicecandidate = async ({ candidate }) => {
  // logger.info('adding pc2 candidate')
  if (candidate) pc1Candidates.push(candidate)
}

pc2.onicecandidate = async ({ candidate }) => {
  // logger.info('adding pc1 candidate')
  if (candidate) pc2Candidates.push(candidate)
}

pc1.onnegotiationneeded = () => logger.info(`pc1 negotiationneeded`)

pc1.onconnectionstatechange = () =>
  logger.info(`pc1 onconnectionstatechange: ${pc1.connectionState}`)

pc1.oniceconnectionstatechange = () =>
  logger.info(`pc1 oniceconnectionstatechange: ${pc1.iceConnectionState}`)

pc2.onnegotiationneeded = () => logger.info(`pc2 negotiationneeded`)
pc2.onconnectionstatechange = () =>
  logger.info(`pc2 onconnectionstatechange: ${pc2.connectionState}`)
pc2.oniceconnectionstatechange = () =>
  logger.info(`pc2 oniceconnectionstatechange: ${pc2.iceConnectionState}`)

dc1.onopen = () => logger.info(`pc1 datachannel: ${dc1.readyState}`)
dc2.onopen = () => logger.info(`pc2 datachannel: ${dc2.readyState}`)

const offer = await pc1.createOffer()
logger.info('pc1 createOfferSuccess')
await pc1.setLocalDescription(offer)
logger.info('pc1 setLocalDescriptionSuccess')

await pc2.setRemoteDescription(offer)
logger.info('pc2 setRemoteDescriptionSuccess')
const answer = await pc2.createAnswer()
logger.info('pc2 createAnswerSuccess')
await pc2.setLocalDescription(answer)
logger.info('pc2 setLocalDescriptionSuccess')

await pc1.setRemoteDescription(answer)
logger.info('pc1 setRemoteDescriptionSuccess')

for (const candidate of pc2Candidates) {
  await pc1.addIceCandidate(candidate)
  logger.info('pc1 addIceCandidateSuccess')
}

for (const candidate of pc1Candidates) {
  await pc2.addIceCandidate(candidate)
  logger.info('pc2 addIceCandidateSuccess')
}

// const dependencies: Dependencies = {
//   WebRTC: NodeWebRTC(),
//   WebSocket: NodeWebSocket(),
// }

// const connector = ConnectorClient({
//   source: 'extension',
//   target: 'wallet',
//   logger: logger,
//   isInitiator: true,
//   dependencies,
//   negotiationTimeout: 60000,
// })

// connector.setConnectionConfig({
//   signalingServerBaseUrl:
//     'wss://signaling-server-dev.rdx-works-main.extratools.works',
// })

// connector.setConnectionPassword(
//   Buffer.from(
//     'c23a3446758d932eab6996a68680bbb3cce08a2b46fa28e1384f6bfaa0f562f8',
//     'hex',
//   ),
// )

// connector.connect()
