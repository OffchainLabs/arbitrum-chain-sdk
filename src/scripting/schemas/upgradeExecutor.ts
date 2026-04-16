import { z } from 'zod';
import { withPublicClient, withPublicClientOptionalChain } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const upgradeExecutorPrepareTransactionRequestSchema = publicClientSchema
  .extend({
    account: addressSchema,
    upgradeExecutorAddress: addressSchema,
    executorAccountAddress: addressSchema,
  })
  .strict();

export const upgradeExecutorPrepareTransactionRequestResolver = withPublicClient;

export const upgradeExecutorFetchPrivilegedAccountsSchema = publicClientSchema
  .extend({
    chainId: z.number().optional(),
    upgradeExecutorAddress: addressSchema,
  })
  .strict();

export const upgradeExecutorFetchPrivilegedAccountsResolver = withPublicClientOptionalChain;
