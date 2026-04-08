import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { upgradeExecutorFetchPrivilegedAccounts } from '../../upgradeExecutorFetchPrivilegedAccounts';

export const upgradeExecutorPrepareTransactionRequestSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  account: addressSchema,
  upgradeExecutorAddress: addressSchema,
  executorAccountAddress: addressSchema,
});

export const upgradeExecutorPrepareTransactionRequestTransform = (
  input: z.output<typeof upgradeExecutorPrepareTransactionRequestSchema>,
): Parameters<typeof upgradeExecutorPrepareAddExecutorTransactionRequest> => [
  {
    account: input.account,
    upgradeExecutorAddress: input.upgradeExecutorAddress,
    executorAccountAddress: input.executorAccountAddress,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
  },
];

export const upgradeExecutorFetchPrivilegedAccountsSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number().optional(),
  upgradeExecutorAddress: addressSchema,
});

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
