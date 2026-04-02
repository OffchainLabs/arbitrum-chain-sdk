import { z } from 'zod';
import { toPublicClient, toWalletClient } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';

const recipientSchema = z.object({
  account: addressSchema,
  weight: bigintSchema,
});

export const feeRouterDeployRewardDistributorSchema = z
  .object({
    orbitChainRpcUrl: z.string().url(),
    privateKey: z.string().startsWith('0x'),
    recipients: z.array(recipientSchema),
  })
  .strict();

export const feeRouterDeployRewardDistributorTransform = (
  input: z.output<typeof feeRouterDeployRewardDistributorSchema>,
) =>
  [
    {
      orbitChainWalletClient: toWalletClient(input.orbitChainRpcUrl, input.privateKey),
      recipients: input.recipients,
    },
  ] as const;

export const feeRouterDeployChildToParentRewardRouterSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    orbitChainRpcUrl: z.string().url(),
    privateKey: z.string().startsWith('0x'),
    parentChainTargetAddress: addressSchema,
    minDistributionInvervalSeconds: bigintSchema.optional(),
    rollup: addressSchema.optional(),
    parentChainTokenAddress: addressSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const feeRouterDeployChildToParentRewardRouterTransform = (
  input: z.output<typeof feeRouterDeployChildToParentRewardRouterSchema>,
) =>
  [
    {
      parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
      orbitChainWalletClient: toWalletClient(input.orbitChainRpcUrl, input.privateKey),
      parentChainTargetAddress: input.parentChainTargetAddress,
      minDistributionInvervalSeconds: input.minDistributionInvervalSeconds,
      rollup: input.rollup,
      parentChainTokenAddress: input.parentChainTokenAddress,
      tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
    },
  ] as const;
