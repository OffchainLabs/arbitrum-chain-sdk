import { withPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const isAnyTrustSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    fromBlock: bigintSchema.optional(),
    toBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClient);
