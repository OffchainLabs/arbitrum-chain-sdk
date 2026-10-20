import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, logBlockRangeSchema, publicClientSchema } from './common';

export const getValidatorsSchema = publicClientSchema
  .extend(logBlockRangeSchema.shape)
  .extend({
    rollup: addressSchema,
  })
  .strict()
  .transform(withPublicClientPositional);
