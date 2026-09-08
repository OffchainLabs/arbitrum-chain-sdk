import { toPublicClient, findOrDefineChain } from '../../viemTransforms';
import { addressSchema, hexSchema, actionWriteBaseSchema } from '../common';

export const buildInvalidateKeysetHashSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    keysetHash: hexSchema,
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, keysetHash, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findOrDefineChain(chainId)),
      { ...rest, params: { keysetHash } },
    ] as const;
  });
