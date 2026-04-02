import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const upgradeExecutorPrepareTransactionRequestSchema = z.object({
  rpcUrl: z.string().url(),
  account: addressSchema,
  upgradeExecutorAddress: addressSchema,
  executorAccountAddress: addressSchema,
});

export const upgradeExecutorPrepareTransactionRequestTransform = (
  input: z.output<typeof upgradeExecutorPrepareTransactionRequestSchema>,
) => [{
  account: input.account,
  upgradeExecutorAddress: input.upgradeExecutorAddress,
  executorAccountAddress: input.executorAccountAddress,
  publicClient: toPublicClient(input.rpcUrl),
}] as const;
