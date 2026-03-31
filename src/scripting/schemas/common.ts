import { z } from 'zod';

export const addressSchema = z.custom<`0x${string}`>(
  (val) => typeof val === 'string' && /^0x[0-9a-fA-F]{40}$/.test(val),
  'Invalid Ethereum address',
);

export const hexSchema = z.custom<`0x${string}`>(
  (val) => typeof val === 'string' && /^0x[0-9a-fA-F]*$/.test(val),
  'Invalid hex string',
);

export const bigintSchema = z.string().transform(BigInt);

export const sequencerInboxMaxTimeVariationSchema = z.object({
  delayBlocks: bigintSchema,
  futureBlocks: bigintSchema,
  delaySeconds: bigintSchema,
  futureSeconds: bigintSchema,
});

export const gasOverrideOptionsSchema = z.object({
  base: bigintSchema.optional(),
  percentIncrease: bigintSchema.optional(),
});

export const gasOverridesSchema = z.object({
  gasLimit: gasOverrideOptionsSchema.optional(),
});

export const retryableGasOverridesSchema = z.object({
  maxSubmissionCostForFactory: gasOverrideOptionsSchema.optional(),
  maxGasForFactory: gasOverrideOptionsSchema.optional(),
  maxSubmissionCostForContracts: gasOverrideOptionsSchema.optional(),
  maxGasForContracts: gasOverrideOptionsSchema.optional(),
  maxGasPrice: bigintSchema.optional(),
});

export const setWethGatewayGasOverridesSchema = z.object({
  gasLimit: gasOverrideOptionsSchema.optional(),
  maxFeePerGas: gasOverrideOptionsSchema.optional(),
  maxSubmissionCost: gasOverrideOptionsSchema.optional(),
});

export const coreContractsSchema = z.object({
  rollup: addressSchema,
  nativeToken: addressSchema,
  inbox: addressSchema,
  outbox: addressSchema,
  rollupEventInbox: addressSchema,
  challengeManager: addressSchema,
  adminProxy: addressSchema,
  sequencerInbox: addressSchema,
  bridge: addressSchema,
  upgradeExecutor: addressSchema,
  validatorUtils: addressSchema.optional(),
  validatorWalletCreator: addressSchema,
  deployedAtBlockNumber: z.number(),
});
