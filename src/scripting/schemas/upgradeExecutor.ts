import { z } from 'zod';
import { withPublicClient, withPublicClientOptionalChain } from '../viemTransforms';
import { addressSchema, logBlockRangeSchema, publicClientSchema } from './common';

export const upgradeExecutorPrepareTransactionRequestSchema = publicClientSchema
  .extend({
    account: addressSchema,
    upgradeExecutorAddress: addressSchema,
    executorAccountAddress: addressSchema,
  })
  .strict()
  .transform(withPublicClient);

export const upgradeExecutorFetchPrivilegedAccountsSchema = publicClientSchema
  .extend(logBlockRangeSchema.shape)
  .extend({
    chainId: z.number().optional(),
    upgradeExecutorAddress: addressSchema,
  })
  .strict()
  .transform(withPublicClientOptionalChain);
