import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, logBlockRangeSchema, publicClientSchema } from './common';

export const getBatchPostersSchema = publicClientSchema
  .extend(logBlockRangeSchema.shape)
  .extend({
    rollup: addressSchema,
    sequencerInbox: addressSchema,
  })
  .strict()
  .transform(withPublicClientPositional);
