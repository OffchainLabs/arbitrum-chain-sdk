import { z } from 'zod';
import { toPublicClient, findOrDefineChain } from '../../viemTransforms';
import { addressSchema, actionWriteBaseSchema } from '../common';

export const buildSetAllowListEnabledSchema = actionWriteBaseSchema
  .extend({
    inbox: addressSchema,
    enabled: z.boolean(),
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, enabled, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findOrDefineChain(chainId)),
      { ...rest, params: { enabled } },
    ] as const;
  });
