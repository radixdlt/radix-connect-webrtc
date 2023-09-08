import type { SignalingServerResponse } from '@radixdlt/radix-connect-schemas'
import { parseJSON } from '../../utils'

export const parseRawMessage = (data: string) =>
  parseJSON<SignalingServerResponse>(data)
