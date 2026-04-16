import { z } from 'zod';
import { withPublicClientOptionalChain } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';

export const fetchAllowanceSchema = publicClientSchema
  .extend({
    chainId: z.number().optional(),
    address: addressSchema,
    owner: addressSchema,
    spender: addressSchema,
  })
  .strict();

export const fetchAllowanceResolver = withPublicClientOptionalChain;

export const fetchDecimalsSchema = publicClientSchema
  .extend({
    chainId: z.number().optional(),
    address: addressSchema,
  })
  .strict();

export const fetchDecimalsResolver = withPublicClientOptionalChain;
