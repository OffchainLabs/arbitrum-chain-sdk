import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema, actionWriteBaseSchema } from '../common';

export const buildSetValidKeysetSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    keyset: hexSchema,
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, keyset, ...rest } = input;
    return [toPublicClient(rpcUrl, findChain(chainId)), { ...rest, params: { keyset } }] as const;
  });
