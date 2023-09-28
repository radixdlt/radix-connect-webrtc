import { Chunked } from '../../helpers'
import type {
  ChunkedMessageType,
  Message,
  MessageChunk,
  MetaData,
} from '../../../_types'
import type { Subject } from 'rxjs'
import { exhaustMap, filter, first, mergeMap, tap } from 'rxjs'
import { parseJSON } from '../../../utils'

const waitForMetaData = (
  onDataChannelMessageSubject: Subject<ChunkedMessageType>,
) =>
  onDataChannelMessageSubject.pipe(
    filter(
      (message): message is MetaData => message.packageType === 'metaData',
    ),
  )

const waitForMessageChuck = (
  onDataChannelMessageSubject: Subject<ChunkedMessageType>,
  messageId: string,
) =>
  onDataChannelMessageSubject.pipe(
    filter(
      (message): message is MessageChunk =>
        message.packageType === 'chunk' && message.messageId === messageId,
    ),
  )

export const handleIncomingChunkedMessages = (
  onDataChannelMessageSubject: Subject<ChunkedMessageType>,
) =>
  waitForMetaData(onDataChannelMessageSubject).pipe(
    exhaustMap((metadata) => {
      const chunked = Chunked(metadata)
      const messageChunk$ = waitForMessageChuck(
        onDataChannelMessageSubject,
        metadata.messageId,
      )
      return messageChunk$.pipe(
        tap((chunk) => chunked.addChunk(chunk)),
        filter(() => {
          const result = chunked.allChunksReceived()
          if (result.isErr()) return true
          return result.value
        }),
        first(),
        mergeMap(() =>
          chunked
            .toString()
            .andThen(parseJSON<Message>)
            .map((message) => ({ messageId: metadata.messageId, message }))
            .mapErr(() => metadata.messageId),
        ),
      )
    }),
  )
