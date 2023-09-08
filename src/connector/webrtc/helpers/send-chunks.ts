import type { Subject } from 'rxjs'
import { filter, of, tap } from 'rxjs'

export const sendChunks = (
  sendMessageOverDataChannelSubject: Subject<string>,
  chunks: string[],
) =>
  of(...chunks).pipe(
    tap((chunk) => sendMessageOverDataChannelSubject.next(chunk)),
    filter(() => false),
  )
