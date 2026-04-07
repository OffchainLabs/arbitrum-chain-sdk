import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import {
  addressSchema,
  hexSchema,
  bigintSchema,
  sequencerInboxMaxTimeVariationSchema,
  bufferConfigSchema,
  assertionStateSchema,
  chainConfigSchema,
} from './common';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';

export const paramsV3Dot2Schema = z.object({
  chainId: bigintSchema,
  owner: addressSchema,
  chainConfig: chainConfigSchema.optional(),
  confirmPeriodBlocks: bigintSchema.optional(),
  stakeToken: addressSchema.optional(),
  baseStake: bigintSchema.optional(),
  wasmModuleRoot: hexSchema.optional(),
  loserStakeEscrow: addressSchema.optional(),
  minimumAssertionPeriod: bigintSchema.optional(),
  validatorAfkBlocks: bigintSchema.optional(),
  miniStakeValues: z.array(bigintSchema).optional(),
  sequencerInboxMaxTimeVariation: sequencerInboxMaxTimeVariationSchema.optional(),
  layerZeroBlockEdgeHeight: bigintSchema.optional(),
  layerZeroBigStepEdgeHeight: bigintSchema.optional(),
  layerZeroSmallStepEdgeHeight: bigintSchema.optional(),
  genesisAssertionState: assertionStateSchema.optional(),
  genesisInboxCount: bigintSchema.optional(),
  anyTrustFastConfirmer: addressSchema.optional(),
  numBigStepLevel: z.number().optional(),
  challengeGracePeriodBlocks: bigintSchema.optional(),
  bufferConfig: bufferConfigSchema.optional(),
  dataCostEstimate: bigintSchema.optional(),
});

export const paramsV2Dot1Schema = z.object({
  chainId: bigintSchema,
  owner: addressSchema,
  chainConfig: chainConfigSchema.optional(),
  confirmPeriodBlocks: bigintSchema.optional(),
  extraChallengeTimeBlocks: bigintSchema.optional(),
  stakeToken: addressSchema.optional(),
  baseStake: bigintSchema.optional(),
  wasmModuleRoot: hexSchema.optional(),
  loserStakeEscrow: addressSchema.optional(),
  genesisBlockNum: bigintSchema.optional(),
  sequencerInboxMaxTimeVariation: sequencerInboxMaxTimeVariationSchema.optional(),
});

const commonFieldsSchema = z.object({
  parentChainRpcUrl: z.string().url(),
});

export const prepareDeploymentParamsConfigV21Schema = commonFieldsSchema
  .extend(paramsV2Dot1Schema.shape)
  .strict();

export const prepareDeploymentParamsConfigV32Schema = commonFieldsSchema
  .extend(paramsV3Dot2Schema.shape)
  .strict();

export const prepareDeploymentParamsConfigV21Transform = (
  input: z.output<typeof prepareDeploymentParamsConfigV21Schema>,
): Parameters<typeof createRollupPrepareDeploymentParamsConfig> => {
  const { parentChainRpcUrl, ...params } = input;
  return [toPublicClient(parentChainRpcUrl), params];
};

export const prepareDeploymentParamsConfigV32Transform = (
  input: z.output<typeof prepareDeploymentParamsConfigV32Schema>,
): Parameters<typeof createRollupPrepareDeploymentParamsConfig> => {
  const { parentChainRpcUrl, ...params } = input;
  return [toPublicClient(parentChainRpcUrl), params];
};
