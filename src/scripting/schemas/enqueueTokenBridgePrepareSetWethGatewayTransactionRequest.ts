import { z } from 'zod';
import { findChain, toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';
import { enqueueTokenBridgePrepareSetWethGatewayTransactionRequest } from '../../enqueueTokenBridgePrepareSetWethGatewayTransactionRequest';

export const enqueueTokenBridgePrepareSetWethGatewayTransactionRequestSchema = z
  .object({
    parentChainId: z.number(),
    parentChainRpcUrl: z.string().url(),
    account: addressSchema,
    rollup: addressSchema,
    rollupDeploymentBlockNumber: bigintSchema,
    gasLimit: bigintSchema.optional(),
    maxGasPrice: bigintSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const enqueueTokenBridgePrepareSetWethGatewayTransactionRequestTransform = (
  input: z.output<typeof enqueueTokenBridgePrepareSetWethGatewayTransactionRequestSchema>,
): Parameters<typeof enqueueTokenBridgePrepareSetWethGatewayTransactionRequest> => [
  {
    rollup: input.rollup,
    account: input.account,
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    gasLimit: input.gasLimit,
    maxGasPrice: input.maxGasPrice,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
