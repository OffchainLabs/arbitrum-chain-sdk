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

export const rollupCreatorVersionSchema = z.enum(['v3.2', 'v2.1']);

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

export const bufferConfigSchema = z.object({
  threshold: bigintSchema,
  max: bigintSchema,
  replenishRateInBasis: bigintSchema,
});

const globalStateSchema = z.object({
  bytes32Vals: z.tuple([hexSchema, hexSchema]),
  u64Vals: z.tuple([bigintSchema, bigintSchema]),
});

export const assertionStateSchema = z.object({
  globalState: globalStateSchema,
  machineStatus: z.number(),
  endHistoryRoot: hexSchema,
});

export const prepareChainConfigArbitrumParamsSchema = z.object({
  InitialChainOwner: addressSchema,
  DataAvailabilityCommittee: z.boolean().optional(),
  InitialArbOSVersion: z.number().optional(),
  MaxCodeSize: z.number().optional(),
  MaxInitCodeSize: z.number().optional(),
});

const chainConfigArbitrumParamsSchema = prepareChainConfigArbitrumParamsSchema.required().extend({
  EnableArbOS: z.boolean(),
  AllowDebugPrecompiles: z.boolean(),
  GenesisBlockNum: z.number(),
});

export const chainConfigSchema = z.object({
  chainId: z.number(),
  homesteadBlock: z.number(),
  daoForkBlock: z.null(),
  daoForkSupport: z.boolean(),
  eip150Block: z.number(),
  eip150Hash: z.string(),
  eip155Block: z.number(),
  eip158Block: z.number(),
  byzantiumBlock: z.number(),
  constantinopleBlock: z.number(),
  petersburgBlock: z.number(),
  istanbulBlock: z.number(),
  muirGlacierBlock: z.number(),
  berlinBlock: z.number(),
  londonBlock: z.number(),
  clique: z.object({ period: z.number(), epoch: z.number() }),
  arbitrum: chainConfigArbitrumParamsSchema,
});
