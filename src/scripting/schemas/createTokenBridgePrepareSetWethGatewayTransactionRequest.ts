import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, setWethGatewayGasOverridesSchema } from './common';

export const createTokenBridgePrepareSetWethGatewayTransactionRequestSchema = z.object({
  parentChainRpcUrl: z.string().url(),
  orbitChainRpcUrl: z.string().url(),
  account: addressSchema,
  rollup: addressSchema,
  rollupDeploymentBlockNumber: bigintSchema.optional(),
  retryableGasOverrides: setWethGatewayGasOverridesSchema.optional(),
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
}).strict();

export const createTokenBridgePrepareSetWethGatewayTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareSetWethGatewayTransactionRequestSchema>,
) => [{
  rollup: input.rollup,
  rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
  account: input.account,
  retryableGasOverrides: input.retryableGasOverrides,
  tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
}] as const;
