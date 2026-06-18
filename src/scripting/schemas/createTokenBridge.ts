import { z } from 'zod';
import { toPublicClient, withParentChainSign } from '../viemTransforms';
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
  .strict()
  .transform((input): Parameters<typeof createTokenBridge> => {
    const [{ orbitChainRpcUrl, ...rest }] = withParentChainSign(input);
    return [{ ...rest, orbitChainPublicClient: toPublicClient(orbitChainRpcUrl) }];
  });
