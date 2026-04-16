import { withChainSign } from '../viemTransforms';
import { addressSchema, privateKeySchema, publicClientSchema } from './common';

export const setAnyTrustFastConfirmerSchema = publicClientSchema
  .extend({
    privateKey: privateKeySchema,
    rollup: addressSchema,
    upgradeExecutor: addressSchema,
    fastConfirmer: addressSchema,
  })
  .strict();

export const setAnyTrustFastConfirmerResolver = withChainSign;
