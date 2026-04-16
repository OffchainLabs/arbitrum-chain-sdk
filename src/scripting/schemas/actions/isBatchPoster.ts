import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, publicClientSchema } from '../common';

export const isBatchPosterSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
    batchPoster: addressSchema,
  })
  .strict();

export const isBatchPosterTransform = (
  input: z.output<typeof isBatchPosterSchema>,
) => {
  const { rpcUrl, chainId, batchPoster, ...rest } = input;
  return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { batchPoster } }] as const;
};
