import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';
import { createRollupFetchTransactionHash } from '../../createRollupFetchTransactionHash';

export const createRollupFetchTransactionHashSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  rollup: addressSchema,
  fromBlock: bigintSchema.optional(),
});

export const createRollupFetchTransactionHashTransform = (
  input: z.output<typeof createRollupFetchTransactionHashSchema>,
): Parameters<typeof createRollupFetchTransactionHash> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    fromBlock: input.fromBlock,
  },
];
