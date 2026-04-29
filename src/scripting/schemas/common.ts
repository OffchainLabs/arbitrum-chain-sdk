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

export const publicClientSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
});

export const parentChainPublicClientSchema = z.strictObject({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
});

export const actionWriteBaseSchema = publicClientSchema.extend({
  account: addressSchema,
  upgradeExecutor: addressSchema.optional().transform((v) => v ?? false),
});

export const privateKeySchema = z
  .string()
  .refine((v): v is Hex => isHex(v) && v.length === 66, 'Invalid private key')
  .transform((val) => val as Hex);

// z.coerce.bigint() calls BigInt() which throws a raw SyntaxError on invalid
// input, bypassing zod's error pipeline -- safeParse can throw, and the error
// has no field path context. Regex guard makes the BigInt() call provably safe.
export const bigintSchema = z
  .string()
  .regex(/^-?\d+$/, 'Expected a numeric string')
  .transform(BigInt);

export const rollupCreatorVersionSchema = z.enum(['v2.1', 'v3.2']);

export const sequencerInboxMaxTimeVariationSchema = z.strictObject({
  delayBlocks: bigintSchema,
  futureBlocks: bigintSchema,
  delaySeconds: bigintSchema,
  futureSeconds: bigintSchema,
});

export const gasOptionsSchema = z.strictObject({
  base: bigintSchema.optional(),
  percentIncrease: bigintSchema.optional(),
});

export const gasLimitSchema = z.strictObject({
  gasLimit: gasOptionsSchema.optional(),
});

export const tokenBridgeRetryableGasOverridesSchema = z.strictObject({
  maxSubmissionCostForFactory: gasOptionsSchema.optional(),
  maxGasForFactory: gasOptionsSchema.optional(),
  maxSubmissionCostForContracts: gasOptionsSchema.optional(),
  maxGasForContracts: gasOptionsSchema.optional(),
  maxGasPrice: bigintSchema.optional(),
});

export const setWethGatewayGasOverridesSchema = z.strictObject({
  gasLimit: gasOptionsSchema.optional(),
  maxFeePerGas: gasOptionsSchema.optional(),
  maxSubmissionCost: gasOptionsSchema.optional(),
});

export const coreContractsSchema = z.strictObject({
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

export const bufferConfigSchema = z.strictObject({
  threshold: bigintSchema,
  max: bigintSchema,
  replenishRateInBasis: bigintSchema,
});

const globalStateSchema = z.strictObject({
  bytes32Vals: z.tuple([hexSchema, hexSchema]),
  u64Vals: z.tuple([bigintSchema, bigintSchema]),
});

export const assertionStateSchema = z.strictObject({
  globalState: globalStateSchema,
  machineStatus: z.number(),
  endHistoryRoot: hexSchema,
});

export const prepareChainConfigArbitrumParamsSchema = z
  .object({
    InitialChainOwner: addressSchema,
    DataAvailabilityCommittee: z.boolean().optional(),
    InitialArbOSVersion: z.number().optional(),
    MaxCodeSize: z.number().optional(),
    MaxInitCodeSize: z.number().optional(),
  })
  .strict();

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

// Only the chainId and 5 arbitrum fields are actually tunable. The other fields
// here (the 3 fixed arbitrum literals, all L1 fork blocks, daoFork*, eip150Hash,
// clique) are accepted -- not because they offer configurability, but so a caller
// can paste their full chainConfig directly from a genesis.json without filtering
// down to the tunable subset. They're validated against the single value Arbitrum
// requires (z.literal) and otherwise rejected; missing fields are filled by
// prepareChainConfig from its defaults. Unknown fields are silently dropped.
export const chainConfigInputSchema = z
  .object({
    chainId: z.number(),
    arbitrum: z
      .object({
        InitialChainOwner: addressSchema.optional(),
        InitialArbOSVersion: z.number().optional(),
        DataAvailabilityCommittee: z.boolean().optional(),
        MaxCodeSize: z.number().optional(),
        MaxInitCodeSize: z.number().optional(),
        EnableArbOS: z.literal(true).optional(),
        AllowDebugPrecompiles: z.literal(false).optional(),
        GenesisBlockNum: z.literal(0).optional(),
      })
      .optional(),
    homesteadBlock: z.literal(0).optional(),
    daoForkBlock: z.null().optional(),
    daoForkSupport: z.literal(true).optional(),
    eip150Block: z.literal(0).optional(),
    eip150Hash: z.literal(ZERO_HASH).optional(),
    eip155Block: z.literal(0).optional(),
    eip158Block: z.literal(0).optional(),
    byzantiumBlock: z.literal(0).optional(),
    constantinopleBlock: z.literal(0).optional(),
    petersburgBlock: z.literal(0).optional(),
    istanbulBlock: z.literal(0).optional(),
    muirGlacierBlock: z.literal(0).optional(),
    berlinBlock: z.literal(0).optional(),
    londonBlock: z.literal(0).optional(),
    clique: z
      .object({ period: z.literal(0), epoch: z.literal(0) })
      .optional(),
  })
  .transform((input) => ({
    chainId: input.chainId,
    arbitrum: {
      InitialChainOwner: input.arbitrum?.InitialChainOwner,
      InitialArbOSVersion: input.arbitrum?.InitialArbOSVersion,
      DataAvailabilityCommittee: input.arbitrum?.DataAvailabilityCommittee,
      MaxCodeSize: input.arbitrum?.MaxCodeSize,
      MaxInitCodeSize: input.arbitrum?.MaxInitCodeSize,
    },
  }));

const chainConfigArbitrumParamsSchema = prepareChainConfigArbitrumParamsSchema.required().extend({
  EnableArbOS: z.boolean(),
  AllowDebugPrecompiles: z.boolean(),
  GenesisBlockNum: z.number(),
});

export const chainConfigSchema = z.strictObject({
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
  clique: z.strictObject({ period: z.number(), epoch: z.number() }),
  arbitrum: chainConfigArbitrumParamsSchema,
});
