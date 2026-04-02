import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';

export const createRollupFetchTransactionHashSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
  fromBlock: bigintSchema.optional(),
}).strict();

export const createRollupFetchTransactionHashTransform = <TChain extends Chain | undefined = undefined>(
  input: z.output<typeof createRollupFetchTransactionHashSchema>,
  chain?: TChain,
) => [{
  rollup: input.rollup,
  publicClient: toPublicClient(input.rpcUrl, chain),
  fromBlock: input.fromBlock,
}] as const;
