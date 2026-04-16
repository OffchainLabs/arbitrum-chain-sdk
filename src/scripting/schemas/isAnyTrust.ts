import { withPublicClient } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const isAnyTrustSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
  })
  .strict()
  .transform(withPublicClient);
