import { withPublicClientPositional } from '../../viemTransforms';
import { addressSchema, publicClientSchema } from '../common';

export const getMaxTimeVariationSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
  })
  .strict()
  .transform(withPublicClientPositional);
