import { withPublicClient } from '../viemTransforms';
import { addressSchema, hexSchema, coreContractsSchema, publicClientSchema } from './common';

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

export const setValidKeysetPrepareTransactionRequestResolver = withPublicClient;
