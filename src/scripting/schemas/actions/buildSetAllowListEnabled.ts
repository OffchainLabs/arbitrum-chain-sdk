import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, actionWriteBaseSchema } from '../common';

export const buildSetAllowListEnabledSchema = actionWriteBaseSchema
  .extend({
    inbox: addressSchema,
    enabled: z.boolean(),
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, enabled, ...rest } = input;
    return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { enabled } }] as const;
  });
