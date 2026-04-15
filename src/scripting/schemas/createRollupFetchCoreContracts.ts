import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';
import { createRollupFetchCoreContracts } from '../../createRollupFetchCoreContracts';

export const createRollupFetchCoreContractsSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    rollupDeploymentBlockNumber: bigintSchema.optional(),
  })
  .strict();

export const createRollupFetchCoreContractsTransform = (
  input: z.output<typeof createRollupFetchCoreContractsSchema>,
): Parameters<typeof createRollupFetchCoreContracts> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
  },
];
