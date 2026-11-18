import { withPublicClient } from '../viemTransforms';
import { addressSchema, logBlockRangeSchema, publicClientSchema } from './common';

export const isAnyTrustSchema = publicClientSchema
  .extend(logBlockRangeSchema.shape)
  .extend({
    rollup: addressSchema,
  })
  .strict()
  .transform(withPublicClient);
