import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';
import { createRollupFetchCoreContracts } from '../../createRollupFetchCoreContracts';

export const createRollupFetchCoreContractsSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  rollup: addressSchema,
  rollupDeploymentBlockNumber: bigintSchema.optional(),
});

export const createRollupFetchCoreContractsTransform = (
  input: z.output<typeof createRollupFetchCoreContractsSchema>,
): Parameters<typeof createRollupFetchCoreContracts> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
  },
];
