import { withPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, logBlockRangeSchema, publicClientSchema } from './common';

export const createRollupFetchCoreContractsSchema = publicClientSchema
  .extend(logBlockRangeSchema.shape)
  .extend({
    rollup: addressSchema,
    rollupDeploymentBlockNumber: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClient);
