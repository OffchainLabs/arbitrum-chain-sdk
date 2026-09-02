import { withPublicClient } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const setAnyTrustFastConfirmerSchema = publicClientSchema
  .extend({
    account: addressSchema,
    rollup: addressSchema,
    upgradeExecutor: addressSchema,
    fastConfirmer: addressSchema,
  })
  .strict()
  .transform(withPublicClient);
