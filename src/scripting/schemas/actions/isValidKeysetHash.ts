import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema, publicClientSchema } from '../common';

export const isValidKeysetHashSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
    keysetHash: hexSchema,
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, keysetHash, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findChain(chainId)),
      { ...rest, params: { keysetHash } },
    ] as const;
  });
