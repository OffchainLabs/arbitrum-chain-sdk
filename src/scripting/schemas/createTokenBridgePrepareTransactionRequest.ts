import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, gasOverridesSchema, retryableGasOverridesSchema } from './common';

export const createTokenBridgePrepareTransactionRequestSchema = z.object({
  parentChainRpcUrl: z.string().url(),
  orbitChainRpcUrl: z.string().url(),
  account: addressSchema,
  params: z.object({
    rollup: addressSchema,
    rollupOwner: addressSchema,
  }),
  gasOverrides: gasOverridesSchema.optional(),
  retryableGasOverrides: retryableGasOverridesSchema.optional(),
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
}).strict();

export const createTokenBridgePrepareTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareTransactionRequestSchema>,
) => [{
  params: input.params,
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
  account: input.account,
  gasOverrides: input.gasOverrides,
  retryableGasOverrides: input.retryableGasOverrides,
  tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
}] as const;
