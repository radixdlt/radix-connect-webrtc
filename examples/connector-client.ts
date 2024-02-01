import { createLogger } from '../src/utils/logger'
// @ts-nocheck
import webRTC from '@koush/wrtc'
import { ConnectorClient } from '../src/radix-connect-webrtc'
import { NodeWebSocket } from '../src/dependencies/websocket'
import type { Dependencies } from '../src/_types'

const logger = createLogger(0)

const NodeWebRTC = () => ({
  RTCIceCandidate: webRTC.RTCIceCandidate,
  RTCSessionDescription: webRTC.RTCSessionDescription,
  RTCPeerConnection: webRTC.RTCPeerConnection,
})

const dependencies: Dependencies = {
  WebRTC: NodeWebRTC(),
  WebSocket: NodeWebSocket(),
}

const connector = ConnectorClient({
  source: 'extension',
  target: 'wallet',
  logger: logger,
  isInitiator: true,
  dependencies,
  negotiationTimeout: 60000,
})

connector.setConnectionConfig({
  signalingServerBaseUrl:
    'wss://signaling-server-dev.rdx-works-main.extratools.works',
  iceTransportPolicy: 'all',
  turnServers: [
    {
      urls: 'turn:standard.relay.metered.ca:80',
      username: '51253affa7c2960189ce8cb6',
      credential: '3HWkp3Wgg2cujD2g',
    },
    {
      urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
      username: '51253affa7c2960189ce8cb6',
      credential: '3HWkp3Wgg2cujD2g',
    },
    {
      urls: 'turn:standard.relay.metered.ca:443',
      username: '51253affa7c2960189ce8cb6',
      credential: '3HWkp3Wgg2cujD2g',
    },
    {
      urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
      username: '51253affa7c2960189ce8cb6',
      credential: '3HWkp3Wgg2cujD2g',
    },
  ],
})

connector.setConnectionPassword(
  Buffer.from(
    'c23a3446758d932eab6996a68680bbb3cce08a2b46fa28e1384f6bfaa0f562f8',
    'hex',
  ),
)

connector.connect()
