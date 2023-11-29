import IsomorphicWebSocket from 'isomorphic-ws'

export type WebSocket = typeof IsomorphicWebSocket
export const NodeWebSocket = (): WebSocket => IsomorphicWebSocket
