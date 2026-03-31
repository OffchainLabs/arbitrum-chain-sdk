import { z } from 'zod';
import { toPublicClient, toAccount } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  gasOverridesSchema,
  retryableGasOverridesSchema,
  setWethGatewayGasOverridesSchema,
} from './common';

export const createTokenBridgeSchema = z.object({
  parentChainRpcUrl: z.string().url(),
  orbitChainRpcUrl: z.string().url(),
  privateKey: z.string().startsWith('0x'),
  rollupOwner: addressSchema,
  rollupAddress: addressSchema,
  rollupDeploymentBlockNumber: bigintSchema.optional(),
  nativeTokenAddress: addressSchema.optional(),
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  gasOverrides: gasOverridesSchema.optional(),
  retryableGasOverrides: retryableGasOverridesSchema.optional(),
  setWethGatewayGasOverrides: setWethGatewayGasOverridesSchema.optional(),
});

export const createTokenBridgeTransform = (input: z.output<typeof createTokenBridgeSchema>) => [{
  rollupOwner: input.rollupOwner,
  rollupAddress: input.rollupAddress,
  account: toAccount(input.privateKey),
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
  rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
  nativeTokenAddress: input.nativeTokenAddress,
  tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  gasOverrides: input.gasOverrides,
  retryableGasOverrides: input.retryableGasOverrides,
  setWethGatewayGasOverrides: input.setWethGatewayGasOverrides,
}] as const;
