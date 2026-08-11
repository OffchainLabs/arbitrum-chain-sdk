import { toPublicClient, findChain } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  publicClientSchema,
  rollupCreatorVersionSchema,
} from './common';

export const createRollupGetRetryablesFeesSchema = publicClientSchema
  .extend({
    account: addressSchema,
    nativeToken: addressSchema.optional(),
    maxFeePerGasForRetryables: bigintSchema.optional(),
    rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
  })
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, rollupCreatorVersion, ...rest } = input;
    return [toPublicClient(rpcUrl, findChain(chainId)), rest, rollupCreatorVersion] as const;
  });
