import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import {
  addressSchema,
  gasLimitSchema,
  parentChainPublicClientSchema,
  tokenBridgeRetryableGasOverridesSchema,
} from './common';
import { createTokenBridgePrepareTransactionRequest } from '../../createTokenBridgePrepareTransactionRequest';

export const createTokenBridgePrepareTransactionRequestSchema = parentChainPublicClientSchema
  .extend({
    account: addressSchema,
    params: z.object({
      rollup: addressSchema,
      rollupOwner: addressSchema,
    }),
    gasOverrides: gasLimitSchema.optional(),
    retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const createTokenBridgePrepareTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareTransactionRequestSchema>,
): Parameters<typeof createTokenBridgePrepareTransactionRequest> => [
  {
    params: input.params,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    account: input.account,
    gasOverrides: input.gasOverrides,
    retryableGasOverrides: input.retryableGasOverrides,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
