import { z } from 'zod';
import { withPublicClient } from '../viemTransforms';
import { addressSchema, hexSchema, coreContractsSchema, publicClientSchema } from './common';
import { setValidKeysetPrepareTransactionRequest } from '../../setValidKeysetPrepareTransactionRequest';

export const setValidKeysetPrepareTransactionRequestSchema = publicClientSchema
  .extend({
    account: addressSchema,
    coreContracts: coreContractsSchema.pick({
      upgradeExecutor: true,
      sequencerInbox: true,
    }),
    keyset: hexSchema,
  })
  .strict();

export const setValidKeysetPrepareTransactionRequestTransform = (
  input: z.output<typeof setValidKeysetPrepareTransactionRequestSchema>,
): Parameters<typeof setValidKeysetPrepareTransactionRequest> => {
  return [withPublicClient(input)];
};
