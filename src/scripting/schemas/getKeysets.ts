import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, logBlockRangeSchema, publicClientSchema } from './common';

export const getKeysetsSchema = publicClientSchema
  .extend(logBlockRangeSchema.shape)
  .extend({
    sequencerInbox: addressSchema,
  })
  .strict()
  .transform(withPublicClientPositional);
