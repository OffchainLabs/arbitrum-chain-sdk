import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';

export const createRollupFetchTransactionHashSchema = z
  .object({
    rpcUrl: z.string().url(),
    rollup: addressSchema,
    fromBlock: bigintSchema.optional(),
  })
  .strict();

export const createRollupFetchTransactionHashTransform = (
  input: z.output<typeof createRollupFetchTransactionHashSchema>,
) =>
  [
    {
      rollup: input.rollup,
      publicClient: toPublicClient(input.rpcUrl),
      fromBlock: input.fromBlock,
    },
  ] as const;
