import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, actionWriteBaseSchema } from '../common';

export const buildSetAllowListSchema = actionWriteBaseSchema
  .extend({
    inbox: addressSchema,
    addresses: z.array(addressSchema),
    allowed: z.array(z.boolean()),
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, addresses, allowed, ...rest } = input;
    return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { addresses, allowed } }] as const;
  });
