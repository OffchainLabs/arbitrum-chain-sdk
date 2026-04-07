import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';
import { createRollupFetchTransactionHash } from '../../createRollupFetchTransactionHash';

export const createRollupFetchTransactionHashSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number().optional(),
    rollup: addressSchema,
    fromBlock: bigintSchema.optional(),
  })
  .strict();

export const createRollupFetchTransactionHashTransform = (
  input: z.output<typeof createRollupFetchTransactionHashSchema>,
): Parameters<typeof createRollupFetchTransactionHash> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, input.chainId ? findChain(input.chainId) : undefined),
    fromBlock: input.fromBlock,
  },
];
