import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema, actionWriteBaseSchema } from '../common';

export const buildInvalidateKeysetHashSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    keysetHash: hexSchema,
  })
  .strict();

export const buildInvalidateKeysetHashTransform = (
  input: z.output<typeof buildInvalidateKeysetHashSchema>,
) => {
  const { rpcUrl, chainId, keysetHash, ...rest } = input;
  return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { keysetHash } }] as const;
};
