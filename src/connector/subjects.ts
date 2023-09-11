import { BehaviorSubject, Subject } from 'rxjs'
import type { ChunkedMessageType, ConnectionConfig, Message } from './_types'

export type ConnectorClientSubjects = ReturnType<typeof ConnectorClientSubjects>

export const ConnectorClientSubjects = () => ({
  shouldConnectSubject: new BehaviorSubject<boolean>(false),
  connected: new BehaviorSubject<boolean>(false),
  connectionConfig: new BehaviorSubject<ConnectionConfig | undefined>(
    undefined,
  ),
  triggerRestartSubject: new Subject<void>(),
  onDataChannelMessageSubject: new Subject<ChunkedMessageType>(),
  onMessage: new Subject<Message>(),
  sendMessageOverDataChannelSubject: new Subject<string>(),
})
