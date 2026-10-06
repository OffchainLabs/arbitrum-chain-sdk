import { withPublicClientPositional } from '../viemTransforms';
import { addressSchema, bigintSchema, publicClientSchema } from './common';

export const getBatchPostersSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    sequencerInbox: addressSchema,
    fromBlock: bigintSchema.optional(),
    toBlock: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClientPositional);
