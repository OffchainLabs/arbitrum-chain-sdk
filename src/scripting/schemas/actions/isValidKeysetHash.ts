import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema, publicClientSchema } from '../common';

export const isValidKeysetHashSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
    keysetHash: hexSchema,
  })
  .strict();

export const isValidKeysetHashTransform = (
  input: z.output<typeof isValidKeysetHashSchema>,
) => {
  const { rpcUrl, chainId, keysetHash, ...rest } = input;
  return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { keysetHash } }] as const;
};
