import { z } from 'zod';
import { withChildChainSign, withParentReadChildSign } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  parentChainPublicClientSchema,
  privateKeySchema,
} from './common';

const recipientSchema = z.object({
  account: addressSchema,
  weight: bigintSchema,
});

export const feeRouterDeployRewardDistributorSchema = z.strictObject({
  orbitChainRpcUrl: z.url(),
  orbitChainId: z.number(),
  privateKey: privateKeySchema,
  recipients: z.array(recipientSchema),
});

export const feeRouterDeployRewardDistributorResolver = withChildChainSign;

export const feeRouterDeployChildToParentRewardRouterSchema = parentChainPublicClientSchema
  .extend({
    orbitChainRpcUrl: z.url(),
    privateKey: privateKeySchema,
    parentChainTargetAddress: addressSchema,
    minDistributionInvervalSeconds: bigintSchema.optional(),
    rollup: addressSchema.optional(),
    parentChainTokenAddress: addressSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const feeRouterDeployChildToParentRewardRouterResolver = withParentReadChildSign;
