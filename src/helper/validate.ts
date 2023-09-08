import type { object, ZodError } from 'zod'
import { err, ok } from 'neverthrow'
import type { Result } from 'neverthrow'
import {
  AnswerIO,
  IceCandidateIO,
  OfferIO,
  IceCandidatesIO,
} from '@radixdlt/radix-connect-schemas'
import type { DataTypes } from '@radixdlt/radix-connect-schemas'

const validate = (
  schema: ReturnType<typeof object>,
  message: DataTypes,
): Result<DataTypes, ZodError> => {
  try {
    schema.parse(message)
    return ok(message)
  } catch (error) {
    return err(error as ZodError)
  }
}

export const validateIncomingMessage = (
  message: DataTypes,
): Result<DataTypes, ZodError | Error> => {
  switch (message.method) {
    case 'offer':
      return validate(OfferIO.omit({ payload: true }), message)
    case 'answer':
      return validate(AnswerIO.omit({ payload: true }), message)
    case 'iceCandidate':
      return validate(IceCandidateIO.omit({ payload: true }), message)
    case 'iceCandidates':
      return validate(IceCandidatesIO.omit({ payload: true }), message)

    default:
      return err(Error('invalid method'))
  }
}
