import { messageToChunked } from '../../helpers'
import type { Message } from '../../_types'
import { Result } from 'neverthrow'
import { stringify } from '../../../utils/stringify'
import { toBuffer } from '../../../utils/to-buffer'

export const prepareMessage = (message: Message, chunkSize: number) =>
  stringify(message)
    .map(toBuffer)
    .asyncAndThen((buffer) => messageToChunked(buffer, chunkSize))
    .andThen((value) =>
      Result.combine([
        stringify(value.metaData),
        ...value.chunks.map(stringify),
      ]).map((chunks) => ({ chunks, messageId: value.metaData.messageId })),
    )
