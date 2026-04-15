import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  parentChainPublicClientSchema,
  privateKeySchema,
  gasLimitSchema,
  tokenBridgeRetryableGasOverridesSchema,
  setWethGatewayGasOverridesSchema,
} from './common';
import { createTokenBridge } from '../../createTokenBridge';

export const createTokenBridgeSchema = parentChainPublicClientSchema
  .extend({
    orbitChainRpcUrl: z.url(),
    privateKey: privateKeySchema,
    rollupOwner: addressSchema,
    rollupAddress: addressSchema,
    rollupDeploymentBlockNumber: bigintSchema.optional(),
    nativeTokenAddress: addressSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    gasOverrides: gasLimitSchema.optional(),
    retryableGasOverrides: tokenBridgeRetryableGasOverridesSchema.optional(),
    setWethGatewayGasOverrides: setWethGatewayGasOverridesSchema.optional(),
  })
  .strict();

export const createTokenBridgeTransform = (
  input: z.output<typeof createTokenBridgeSchema>,
): Parameters<typeof createTokenBridge> => [
  {
    rollupOwner: input.rollupOwner,
    rollupAddress: input.rollupAddress,
    account: toAccount(input.privateKey),
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
    nativeTokenAddress: input.nativeTokenAddress,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
    gasOverrides: input.gasOverrides,
    retryableGasOverrides: input.retryableGasOverrides,
    setWethGatewayGasOverrides: input.setWethGatewayGasOverrides,
  },
];
