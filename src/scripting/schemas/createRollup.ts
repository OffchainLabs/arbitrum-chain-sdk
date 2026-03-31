import { z } from 'zod';
import { toPublicClient, toAccount } from '../viemTransforms';
import { addressSchema, hexSchema, bigintSchema, sequencerInboxMaxTimeVariationSchema } from './common';

const bufferConfigSchema = z.object({
  threshold: bigintSchema,
  max: bigintSchema,
  replenishRateInBasis: bigintSchema,
});

const globalStateSchema = z.object({
  bytes32Vals: z.tuple([hexSchema, hexSchema]),
  u64Vals: z.tuple([bigintSchema, bigintSchema]),
});

const assertionStateSchema = z.object({
  globalState: globalStateSchema,
  machineStatus: z.number(),
  endHistoryRoot: hexSchema,
});

const configV3Dot2Schema = z.object({
  confirmPeriodBlocks: bigintSchema,
  stakeToken: addressSchema,
  baseStake: bigintSchema,
  wasmModuleRoot: hexSchema,
  owner: addressSchema,
  loserStakeEscrow: addressSchema,
  chainId: bigintSchema,
  chainConfig: z.string(),
  minimumAssertionPeriod: bigintSchema,
  validatorAfkBlocks: bigintSchema,
  miniStakeValues: z.array(bigintSchema),
  sequencerInboxMaxTimeVariation: sequencerInboxMaxTimeVariationSchema,
  layerZeroBlockEdgeHeight: bigintSchema,
  layerZeroBigStepEdgeHeight: bigintSchema,
  layerZeroSmallStepEdgeHeight: bigintSchema,
  genesisAssertionState: assertionStateSchema,
  genesisInboxCount: bigintSchema,
  anyTrustFastConfirmer: addressSchema,
  numBigStepLevel: z.number(),
  challengeGracePeriodBlocks: bigintSchema,
  bufferConfig: bufferConfigSchema,
  dataCostEstimate: bigintSchema,
});

const configV2Dot1Schema = z.object({
  confirmPeriodBlocks: bigintSchema,
  extraChallengeTimeBlocks: bigintSchema,
  stakeToken: addressSchema,
  baseStake: bigintSchema,
  wasmModuleRoot: hexSchema,
  owner: addressSchema,
  loserStakeEscrow: addressSchema,
  chainId: bigintSchema,
  chainConfig: z.string(),
  genesisBlockNum: bigintSchema,
  sequencerInboxMaxTimeVariation: sequencerInboxMaxTimeVariationSchema,
});

const paramsV3Dot2Schema = z.object({
  config: configV3Dot2Schema,
  batchPosters: z.array(addressSchema).min(1),
  validators: z.array(addressSchema).min(1),
  maxDataSize: bigintSchema.optional(),
  nativeToken: addressSchema.optional(),
  deployFactoriesToL2: z.boolean().optional(),
  maxFeePerGasForRetryables: bigintSchema.optional(),
  batchPosterManager: addressSchema.optional(),
  feeTokenPricer: addressSchema.optional(),
  customOsp: addressSchema.optional(),
});

const paramsV2Dot1Schema = z.object({
  config: configV2Dot1Schema,
  batchPosters: z.array(addressSchema).min(1),
  validators: z.array(addressSchema).min(1),
  maxDataSize: bigintSchema.optional(),
  nativeToken: addressSchema.optional(),
  deployFactoriesToL2: z.boolean().optional(),
  maxFeePerGasForRetryables: bigintSchema.optional(),
  batchPosterManager: addressSchema.optional(),
});

const commonFieldsSchema = z.object({
  parentChainRpcUrl: z.string().url(),
  privateKey: z.string().startsWith('0x'),
});

export const createRollupV21Schema = commonFieldsSchema.extend({
  params: paramsV2Dot1Schema,
  rollupCreatorVersion: z.literal('v2.1'),
});
export const createRollupV32Schema = commonFieldsSchema.extend({
  params: paramsV3Dot2Schema,
  rollupCreatorVersion: z.literal('v3.2'),
});
export const createRollupDefaultSchema = commonFieldsSchema.extend({
  params: paramsV3Dot2Schema,
  rollupCreatorVersion: z.never().optional(),
});

export const createRollupSchema = z.union([
  createRollupV21Schema,
  createRollupV32Schema,
  createRollupDefaultSchema,
]);

export const createRollupTransform = <T extends z.output<typeof createRollupSchema>>(input: T) => [{
  params: input.params as T['params'],
  account: toAccount(input.privateKey),
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  rollupCreatorVersion: input.rollupCreatorVersion as T['rollupCreatorVersion'],
}] as const;

export const createRollupTransformedSchema = z.union([
  createRollupV21Schema.transform(createRollupTransform),
  createRollupV32Schema.transform(createRollupTransform),
  createRollupDefaultSchema.transform(createRollupTransform),
]);
