import { withPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const createRollupFetchCoreContractsSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    rollupDeploymentBlockNumber: bigintSchema.optional(),
    fromBlock: bigintSchema.optional(),
    toBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClient);
