import { polyfillWebRTC } from './polyfill'

polyfillWebRTC()

export { ConnectorClient } from './connector/connector-client'
export { createLogger } from './utils/logger'
export { WebRtcSubjects } from './connector/webrtc/subjects'
export { SignalingSubjects } from './connector/signaling/subjects'
export { ConnectorClientSubjects } from './connector/subjects'

export const turnServers = {
  test: [
    {
      urls: 'turn:turn-dev-udp.rdx-works-main.extratools.works:80?transport=udp',
      username: 'username',
      credential: 'password',
    },
    {
      urls: 'turn:turn-dev-tcp.rdx-works-main.extratools.works:80?transport=tcp',
      username: 'username',
      credential: 'password',
    },
  ],
  rcnet: [
    {
      urls: 'turn:turn-rcnet-udp.radixdlt.com:80?transport=udp',
      username: 'username',
      credential: 'password',
    },
    {
      urls: 'turn:turn-rcnet-tcp.radixdlt.com:80?transport=tcp',
      username: 'username',
      credential: 'password',
    },
  ],
  production: [
    {
      urls: 'turn:turn-udp.radixdlt.com:80?transport=udp',
      username: 'username',
      credential: 'password',
    },
    {
      urls: 'turn:turn-tcp.radixdlt.com:80?transport=tcp',
      username: 'username',
      credential: 'password',
    },
  ],
  development: [
    {
      urls: 'turn:turn-dev-udp.rdx-works-main.extratools.works:80?transport=udp',
      username: 'username',
      credential: 'password',
    },
    {
      urls: 'turn:turn-dev-tcp.rdx-works-main.extratools.works:80?transport=tcp',
      username: 'username',
      credential: 'password',
    },
  ],
} as const
