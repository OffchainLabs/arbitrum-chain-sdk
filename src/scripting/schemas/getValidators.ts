import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const getValidatorsSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
  })
  .strict();

export const getValidatorsResolver = withPublicClientPositional;
