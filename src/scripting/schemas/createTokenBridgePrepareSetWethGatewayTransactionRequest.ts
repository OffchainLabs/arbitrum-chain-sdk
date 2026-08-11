import { withParentChainPublicClient } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  parentChainPublicClientSchema,
  setWethGatewayGasOverridesSchema,
} from './common';

export const createTokenBridgePrepareSetWethGatewayTransactionRequestSchema =
  parentChainPublicClientSchema
    .extend({
      account: addressSchema,
      rollup: addressSchema,
      rollupDeploymentBlockNumber: bigintSchema.optional(),
      retryableGasOverrides: setWethGatewayGasOverridesSchema.optional(),
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    })
    .strict()
    .transform(withParentChainPublicClient);
