import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema, setWethGatewayGasOverridesSchema } from './common';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../../createTokenBridgePrepareSetWethGatewayTransactionRequest';

export const createTokenBridgePrepareSetWethGatewayTransactionRequestSchema = z.strictObject({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
  orbitChainRpcUrl: z.url(),
  account: addressSchema,
  rollup: addressSchema,
  rollupDeploymentBlockNumber: bigintSchema.optional(),
  retryableGasOverrides: setWethGatewayGasOverridesSchema.optional(),
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export const createTokenBridgePrepareSetWethGatewayTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareSetWethGatewayTransactionRequestSchema>,
): Parameters<typeof createTokenBridgePrepareSetWethGatewayTransactionRequest> => [
  {
    rollup: input.rollup,
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
    account: input.account,
    retryableGasOverrides: input.retryableGasOverrides,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
