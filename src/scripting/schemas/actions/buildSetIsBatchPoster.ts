import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, actionWriteBaseSchema } from '../common';

export const buildSetIsBatchPosterSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    batchPoster: addressSchema,
    enable: z.boolean(),
  })
  .strict();

export const buildSetIsBatchPosterTransform = (
  input: z.output<typeof buildSetIsBatchPosterSchema>,
) => {
  const { rpcUrl, chainId, batchPoster, enable, ...rest } = input;
  return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { batchPoster, enable } }] as const;
};
