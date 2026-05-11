import { z } from 'zod';
import { withParentChainPublicClient } from '../viemTransforms';
import {
  addressSchema,
  gasLimitSchema,
  parentChainPublicClientSchema,
  tokenBridgeRetryableGasOverridesSchema,
} from './common';

export const createTokenBridgePrepareTransactionRequestSchema = parentChainPublicClientSchema
  .extend({
    account: addressSchema,
    params: z.strictObject({
      rollup: addressSchema,
      rollupOwner: addressSchema,
    }),
    gasOverrides: gasLimitSchema.optional(),
    retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict()
  .transform(withParentChainPublicClient);
