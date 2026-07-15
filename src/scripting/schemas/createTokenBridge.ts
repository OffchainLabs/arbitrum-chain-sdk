import { z } from 'zod';
import {
  registerCustomParentChainFromInput,
  toPublicClient,
  withParentChainSign,
} from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  nativeCurrencySchema,
  parentChainContractsSchema,
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
    // createTokenBridge reads the parent chain's tokenBridgeCreator (and weth for the weth gateway),
    // so a custom parent must supply them.
    parentChainContracts: parentChainContractsSchema({ tokenBridgeCreator: true, weth: true }),
    parentChainName: z.string().optional(),
    parentChainNativeCurrency: nativeCurrencySchema.optional(),
  })
  .strict()
  .transform((input): Parameters<typeof createTokenBridge> => {
    const [{ orbitChainRpcUrl, ...rest }] = withParentChainSign(
      registerCustomParentChainFromInput(input),
    );
    return [{ ...rest, orbitChainPublicClient: toPublicClient(orbitChainRpcUrl) }];
  });
