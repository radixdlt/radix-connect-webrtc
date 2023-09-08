import { secureRandom } from '../../crypto/secure-random'

export const generateConnectionPassword = (byteLength = 32) =>
  secureRandom(byteLength)
