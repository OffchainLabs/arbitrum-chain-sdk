import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const getBatchPostersSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    sequencerInbox: addressSchema,
  })
  .strict()
  .transform(withPublicClientPositional);
