import { toPublicClient, findOrDefineChain } from '../../viemTransforms';
import { addressSchema, publicClientSchema } from '../common';

export const isBatchPosterSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
    batchPoster: addressSchema,
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, batchPoster, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findOrDefineChain(chainId)),
      { ...rest, params: { batchPoster } },
    ] as const;
  });
