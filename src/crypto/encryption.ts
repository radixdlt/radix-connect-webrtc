import { ResultAsync } from 'neverthrow'
import { errorIdentity } from '../utils/error-identity'
import type { SealedBoxProps } from './sealbox'
import { secureRandom } from './secure-random'
import { Buffer } from 'buffer'
import webcrypto from 'isomorphic-webcrypto'

export const createIV = () => secureRandom(12)

export const getKey = (encryptionKey: Buffer) =>
  ResultAsync.fromPromise(
    webcrypto.subtle.importKey(
      'raw',
      encryptionKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt'],
    ),
    errorIdentity,
  )

const cryptoDecrypt = (data: Buffer, encryptionKey: CryptoKey, iv: Buffer) =>
  ResultAsync.fromPromise(
    webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKey, data),
    errorIdentity,
  ).map(Buffer.from)

const cryptoEncrypt = (data: Buffer, encryptionKey: CryptoKey, iv: Buffer) =>
  ResultAsync.fromPromise(
    webcrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      encryptionKey,
      data,
    ),
    errorIdentity,
  ).map(Buffer.from)

export const decrypt = (
  data: Buffer,
  encryptionKey: Buffer,
  iv: Buffer,
): ResultAsync<Buffer, Error> =>
  getKey(encryptionKey).andThen((cryptoKey) =>
    cryptoDecrypt(data, cryptoKey, iv),
  )

const combineIVandCipherText = (iv: Buffer, ciphertext: Buffer): Buffer =>
  Buffer.concat([iv, ciphertext])

export const encrypt = (
  data: Buffer,
  encryptionKey: Buffer,
  iv: Buffer,
): ResultAsync<
  Omit<SealedBoxProps, 'ciphertextAndAuthTag' | 'authTag'>,
  Error
> =>
  getKey(encryptionKey)
    .andThen((cryptoKey) => cryptoEncrypt(data, cryptoKey, iv))
    .map((ciphertext) => ({
      combined: combineIVandCipherText(iv, ciphertext),
      iv,
      ciphertext,
    }))
    .mapErr((error) => error)
