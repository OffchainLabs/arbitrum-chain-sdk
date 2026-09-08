import { z } from 'zod';
import { toPublicClient, findOrDefineChain } from '../../viemTransforms';
import { addressSchema, actionWriteBaseSchema } from '../common';

export const buildSetIsBatchPosterSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    batchPoster: addressSchema,
    enable: z.boolean(),
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, batchPoster, enable, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findOrDefineChain(chainId)),
      { ...rest, params: { batchPoster, enable } },
    ] as const;
  });
