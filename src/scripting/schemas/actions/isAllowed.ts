import { toPublicClient, findOrDefineChain } from '../../viemTransforms';
import { addressSchema, publicClientSchema } from '../common';

export const isAllowedSchema = publicClientSchema
  .extend({
    inbox: addressSchema,
    address: addressSchema,
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, address, ...rest } = input;
    return [
      toPublicClient(rpcUrl, findOrDefineChain(chainId)),
      { ...rest, params: { address } },
    ] as const;
  });
