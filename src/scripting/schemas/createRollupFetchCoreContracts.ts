import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';

export const createRollupFetchCoreContractsSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
  rollupDeploymentBlockNumber: bigintSchema.optional(),
}).strict();

export const createRollupFetchCoreContractsTransform = <TChain extends Chain | undefined = undefined>(
  input: z.output<typeof createRollupFetchCoreContractsSchema>,
  chain?: TChain,
) => [{
  rollup: input.rollup,
  publicClient: toPublicClient(input.rpcUrl, chain),
  rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
}] as const;
