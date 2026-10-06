import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const getValidatorsSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    fromBlock: bigintSchema.optional(),
    toBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClientPositional);
