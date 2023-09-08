import type { Result } from 'neverthrow'
import { ok, err } from 'neverthrow'
import { errorIdentity } from './error-identity'
import { Buffer } from 'buffer'

export const chunksToBuffer = (chunks: Buffer[]): Result<Buffer, Error> => {
  try {
    return ok(Buffer.concat(chunks))
  } catch (error) {
    return err(errorIdentity(error))
  }
}
