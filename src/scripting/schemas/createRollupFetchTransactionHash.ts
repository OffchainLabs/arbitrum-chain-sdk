import { withPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const createRollupFetchTransactionHashSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    fromBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClient);
