import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { upgradeExecutorFetchPrivilegedAccounts } from '../../upgradeExecutorFetchPrivilegedAccounts';

export const upgradeExecutorPrepareTransactionRequestSchema = z
  .object({
    rpcUrl: z.string().url(),
    account: addressSchema,
    upgradeExecutorAddress: addressSchema,
    executorAccountAddress: addressSchema,
  })
  .strict();

export const upgradeExecutorPrepareTransactionRequestTransform = (
  input: z.output<typeof upgradeExecutorPrepareTransactionRequestSchema>,
): Parameters<typeof upgradeExecutorPrepareAddExecutorTransactionRequest> => [
  {
    account: input.account,
    upgradeExecutorAddress: input.upgradeExecutorAddress,
    executorAccountAddress: input.executorAccountAddress,
    publicClient: toPublicClient(input.rpcUrl),
  },
];

export const upgradeExecutorFetchPrivilegedAccountsSchema = z
  .object({
    rpcUrl: z.string().url(),
    upgradeExecutorAddress: addressSchema,
  })
  .strict();

export const upgradeExecutorFetchPrivilegedAccountsTransform = (
  input: z.output<typeof upgradeExecutorFetchPrivilegedAccountsSchema>,
): Parameters<typeof upgradeExecutorFetchPrivilegedAccounts> => [
  {
    upgradeExecutorAddress: input.upgradeExecutorAddress,
    publicClient: toPublicClient(input.rpcUrl),
  },
];
