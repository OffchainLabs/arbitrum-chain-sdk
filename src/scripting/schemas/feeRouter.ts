import { z } from 'zod';
import { toPublicClient, toWalletClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema, privateKeySchema } from './common';
import { feeRouterDeployRewardDistributor } from '../../feeRouterDeployRewardDistributor';
import { feeRouterDeployChildToParentRewardRouter } from '../../feeRouterDeployChildToParentRewardRouter';

const recipientSchema = z.object({
  account: addressSchema,
  weight: bigintSchema,
});

export const feeRouterDeployRewardDistributorSchema = z
  .object({
    orbitChainRpcUrl: z.string().url(),
    orbitChainId: z.number().optional(),
    privateKey: privateKeySchema,
    recipients: z.array(recipientSchema),
  })
  .strict();

export const feeRouterDeployRewardDistributorTransform = (
  input: z.output<typeof feeRouterDeployRewardDistributorSchema>,
): Parameters<typeof feeRouterDeployRewardDistributor> => [
  {
    orbitChainWalletClient: toWalletClient(
      input.orbitChainRpcUrl,
      input.privateKey,
      input.orbitChainId ? findChain(input.orbitChainId) : undefined,
    ),
    recipients: input.recipients,
  },
];

export const feeRouterDeployChildToParentRewardRouterSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    parentChainId: z.number(),
    orbitChainRpcUrl: z.string().url(),
    privateKey: privateKeySchema,
    parentChainTargetAddress: addressSchema,
    minDistributionInvervalSeconds: bigintSchema.optional(),
    rollup: addressSchema.optional(),
    parentChainTokenAddress: addressSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const feeRouterDeployChildToParentRewardRouterTransform = (
  input: z.output<typeof feeRouterDeployChildToParentRewardRouterSchema>,
): Parameters<typeof feeRouterDeployChildToParentRewardRouter> => [
  {
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainWalletClient: toWalletClient(input.orbitChainRpcUrl, input.privateKey),
    parentChainTargetAddress: input.parentChainTargetAddress,
    minDistributionInvervalSeconds: input.minDistributionInvervalSeconds,
    rollup: input.rollup,
    parentChainTokenAddress: input.parentChainTokenAddress,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
