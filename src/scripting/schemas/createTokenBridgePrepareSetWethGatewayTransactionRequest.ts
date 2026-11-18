import { withParentChainPublicClient } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  logBlockRangeSchema,
  parentChainPublicClientSchema,
  setWethGatewayGasOverridesSchema,
} from './common';

export const createTokenBridgePrepareSetWethGatewayTransactionRequestSchema =
  parentChainPublicClientSchema
    .extend(logBlockRangeSchema.shape)
    .extend({
      account: addressSchema,
      rollup: addressSchema,
      rollupDeploymentBlockNumber: bigintSchema.optional(),
      retryableGasOverrides: setWethGatewayGasOverridesSchema.optional(),
      tokenBridgeCreatorAddressOverride: addressSchema.optional(),
    })
    .strict()
    .transform(withParentChainPublicClient);
