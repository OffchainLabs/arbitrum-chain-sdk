import { withPublicClientPositional } from '../../viemTransforms';
import { addressSchema, publicClientSchema } from '../common';

export const isAllowListEnabledSchema = publicClientSchema
  .extend({
    inbox: addressSchema,
  })
  .strict()
  .transform(withPublicClientPositional);
