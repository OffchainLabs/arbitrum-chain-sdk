import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const getKeysetsSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
  })
  .strict();

export const getKeysetsResolver = withPublicClientPositional;
