import { z } from 'zod';
import { withChainSign } from '../viemTransforms';
import { addressSchema, bigintSchema, privateKeySchema, publicClientSchema } from './common';

export const createSafePrepareTransactionRequestSchema = publicClientSchema
  .extend({
    privateKey: privateKeySchema,
    owners: z.array(addressSchema),
    threshold: z.number(),
    saltNonce: bigintSchema.optional(),
  })
  .strict();

export const createSafePrepareTransactionRequestResolver = withChainSign;
