import { z } from 'zod';
import { isAddress, isHex, type Address, type Hex } from 'viem';

export const hexSchema = z
  .string()
  .refine(isHex, 'Invalid hex string')
  .transform((val) => val as Hex);

export const addressSchema = z
  .string()
  .refine((v): v is Address => isAddress(v), 'Invalid Ethereum address')
  .transform((val) => val as Address);

export const publicClientSchema = z.object({
  rpcUrl: z.url(),
  chainId: z.number(),
});

export const parentChainPublicClientSchema = z.object({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
});

export const actionWriteBaseSchema = publicClientSchema.extend({
  account: addressSchema,
  upgradeExecutor: addressSchema.optional().transform((v) => v ?? false),
});

export const privateKeySchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid private key')
  .transform((val) => val as `0x${string}`);

// z.coerce.bigint() calls BigInt() which throws a raw SyntaxError on invalid
// input, bypassing zod's error pipeline -- safeParse can throw, and the error
// has no field path context. Regex guard makes the BigInt() call provably safe.
export const bigintSchema = z
  .string()
  .regex(/^-?\d+$/, 'Expected a numeric string')
  .transform(BigInt);

export const rollupCreatorVersionSchema = z.enum(['v3.2', 'v2.1']);

export const sequencerInboxMaxTimeVariationSchema = z.object({
  delayBlocks: bigintSchema,
  futureBlocks: bigintSchema,
  delaySeconds: bigintSchema,
  futureSeconds: bigintSchema,
});

export const gasOptionsSchema = z.object({
  base: bigintSchema.optional(),
  percentIncrease: bigintSchema.optional(),
});

export const gasLimitSchema = z.object({
  gasLimit: gasOptionsSchema.optional(),
});

export const tokenBridgeRetryableGasOverridesSchema = z.object({
  maxSubmissionCostForFactory: gasOptionsSchema.optional(),
  maxGasForFactory: gasOptionsSchema.optional(),
  maxSubmissionCostForContracts: gasOptionsSchema.optional(),
  maxGasForContracts: gasOptionsSchema.optional(),
  maxGasPrice: bigintSchema.optional(),
});

export const setWethGatewayGasOverridesSchema = z.object({
  gasLimit: gasOptionsSchema.optional(),
  maxFeePerGas: gasOptionsSchema.optional(),
  maxSubmissionCost: gasOptionsSchema.optional(),
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
