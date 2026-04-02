import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';

export const createRollupFetchCoreContractsSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
  rollupDeploymentBlockNumber: bigintSchema.optional(),
}).strict();

export const createRollupFetchCoreContractsTransform = (
  input: z.output<typeof createRollupFetchCoreContractsSchema>,
) => [{
  rollup: input.rollup,
  publicClient: toPublicClient(input.rpcUrl),
  rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
}] as const;
