import type { ChunkedMessageType, MessageConfirmation } from '../../../_types'
import type { Subject } from 'rxjs'
import { filter } from 'rxjs'

export const waitForConfirmation = (
  onDataChannelMessageSubject: Subject<ChunkedMessageType>,
  messageId: string,
) =>
  onDataChannelMessageSubject.pipe(
    filter(
      (message): message is MessageConfirmation =>
        message.packageType === 'receiveMessageConfirmation' &&
        message.messageId === messageId,
    ),
  )
