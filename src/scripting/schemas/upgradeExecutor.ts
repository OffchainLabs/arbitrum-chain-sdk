import { z } from 'zod';
import { toPublicClient, findChain, withPublicClient } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { upgradeExecutorFetchPrivilegedAccounts } from '../../upgradeExecutorFetchPrivilegedAccounts';

export const upgradeExecutorPrepareTransactionRequestSchema = publicClientSchema
  .extend({
    account: addressSchema,
    upgradeExecutorAddress: addressSchema,
    executorAccountAddress: addressSchema,
  })
  .strict();

export const upgradeExecutorPrepareTransactionRequestTransform = (
  input: z.output<typeof upgradeExecutorPrepareTransactionRequestSchema>,
): Parameters<typeof upgradeExecutorPrepareAddExecutorTransactionRequest> => {
  return [withPublicClient(input)];
};

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
