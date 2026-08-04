import { z } from 'zod';
import { addressSchema, bigintSchema, publicClientSchema } from './common';
import { withPublicClient } from '../viemTransforms';

export const createSafePrepareTransactionRequestSchema = publicClientSchema
  .extend({
    account: addressSchema,
    owners: z.array(addressSchema),
    threshold: z.number(),
    saltNonce: bigintSchema.optional(),
  })
  .strict()
  .transform(withPublicClient);
