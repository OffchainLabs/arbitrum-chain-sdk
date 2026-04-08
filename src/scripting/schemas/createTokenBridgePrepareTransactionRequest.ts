import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, gasLimitSchema, tokenBridgeRetryableGasOverridesSchema } from './common';
import { createTokenBridgePrepareTransactionRequest } from '../../createTokenBridgePrepareTransactionRequest';

export const createTokenBridgePrepareTransactionRequestSchema = z.strictObject({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
  orbitChainRpcUrl: z.url(),
  account: addressSchema,
  params: z.object({
    rollup: addressSchema,
    rollupOwner: addressSchema,
  }),
  gasOverrides: gasLimitSchema.optional(),
  retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export const createTokenBridgePrepareTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareTransactionRequestSchema>,
): Parameters<typeof createTokenBridgePrepareTransactionRequest> => [
  {
    params: input.params,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
    account: input.account,
    gasOverrides: input.gasOverrides,
    retryableGasOverrides: input.retryableGasOverrides,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
