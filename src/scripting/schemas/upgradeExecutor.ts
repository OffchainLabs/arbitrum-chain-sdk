import { z } from 'zod';
import { toPublicClient, findChain, withPublicClient } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';
import { upgradeExecutorFetchPrivilegedAccounts } from '../../upgradeExecutorFetchPrivilegedAccounts';

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

export const upgradeExecutorFetchPrivilegedAccountsTransform = (
  input: z.output<typeof upgradeExecutorFetchPrivilegedAccountsSchema>,
): Parameters<typeof upgradeExecutorFetchPrivilegedAccounts> => [
  {
    upgradeExecutorAddress: input.upgradeExecutorAddress,
    publicClient: toPublicClient(
      input.rpcUrl,
      input.chainId ? findChain(input.chainId) : undefined,
    ),
  },
];
