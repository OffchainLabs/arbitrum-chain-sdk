import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const getKeysetsSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
    fromBlock: bigintSchema.optional(),
    toBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClientPositional);
