import { z } from 'zod';
import { withPublicClient, withPublicClientOptionalChain } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const upgradeExecutorPrepareTransactionRequestSchema = publicClientSchema
  .extend({
    account: addressSchema,
    upgradeExecutorAddress: addressSchema,
    executorAccountAddress: addressSchema,
  })
  .strict()
  .transform(withPublicClient);

export const upgradeExecutorFetchPrivilegedAccountsSchema = publicClientSchema
  .extend({
    chainId: z.number().optional(),
    upgradeExecutorAddress: addressSchema,
    fromBlock: bigintSchema.optional(),
    toBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClientOptionalChain);
