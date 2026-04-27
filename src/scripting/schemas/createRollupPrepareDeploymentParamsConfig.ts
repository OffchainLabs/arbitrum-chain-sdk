import { z } from 'zod';
import { zeroHash } from 'viem';
import { toPublicClient, findChain } from '../viemTransforms';
import {
  addressSchema,
  hexSchema,
  bigintSchema,
  parentChainPublicClientSchema,
  sequencerInboxMaxTimeVariationSchema,
  bufferConfigSchema,
  assertionStateSchema,
  chainConfigSchema,
} from './common';
import { CreateRollupPrepareDeploymentParamsConfigParams } from '../../createRollupPrepareDeploymentParamsConfig';

export const paramsV3Dot2Schema = z.strictObject({
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

export const paramsV2Dot1Schema = z.strictObject({
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

/**
 * Custom genesis (non-default `genesisAssertionState`) bakes a precomputed L2
 * genesis block hash into the assertion. Reproducing that hash at validator
 * boot requires both the on-chain init message's currentDataCost and the
 * serialized chainConfig to match what genesis-file-generator used. Otherwise
 * the validator's first stakeOnNewAssertion reverts with ASSERTION_NOT_EXIST.
 *
 * - dataCostEstimate must be non-zero. The contract treats 0 as a sentinel and
 *   substitutes block.basefee.
 * - chainConfig must be supplied. Falling through to the SDK default produces
 *   a chainConfig that won't match the one genesis-file-generator used.
 */
export function refineV3Dot2CustomGenesis(
  config: {
    genesisAssertionState?: z.output<typeof assertionStateSchema>;
    dataCostEstimate?: bigint;
    chainConfig?: unknown;
  },
  ctx: z.RefinementCtx,
  pathToConfig: readonly (string | number)[],
): void {
  const gas = config.genesisAssertionState;
  if (!gas) return;
  const isCustomGenesis =
    gas.globalState.bytes32Vals[0] !== zeroHash ||
    gas.globalState.bytes32Vals[1] !== zeroHash ||
    gas.globalState.u64Vals[0] !== BigInt(0);
  if (!isCustomGenesis) return;

  if (config.dataCostEstimate === undefined || config.dataCostEstimate === BigInt(0)) {
    ctx.addIssue({
      code: 'custom',
      path: [...pathToConfig, 'dataCostEstimate'],
      message:
        'dataCostEstimate must be set to a non-zero value when genesisAssertionState is provided. It must equal arbOSInit.initialL1BaseFee from your genesis.json; otherwise validators will revert with ASSERTION_NOT_EXIST when staking on the first assertion.',
    });
  }
  if (config.chainConfig === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: [...pathToConfig, 'chainConfig'],
      message:
        'chainConfig must be supplied when genesisAssertionState is provided. It must match the serializedChainConfig used by genesis-file-generator; otherwise validators will revert with ASSERTION_NOT_EXIST when staking on the first assertion.',
    });
  }
}

export const prepareDeploymentParamsConfigV21Schema = parentChainPublicClientSchema
  .extend(paramsV2Dot1Schema.shape)
  .strict()
  .transform(
    (
      input,
    ): [
      ReturnType<typeof toPublicClient>,
      CreateRollupPrepareDeploymentParamsConfigParams<'v2.1'>,
    ] => {
      const { parentChainRpcUrl, parentChainId, ...params } = input;
      return [toPublicClient(parentChainRpcUrl, findChain(parentChainId)), params];
    },
  );

export const prepareDeploymentParamsConfigV32Schema = parentChainPublicClientSchema
  .extend(paramsV3Dot2Schema.shape)
  .strict()
  .superRefine((data, ctx) => {
    refineV3Dot2CustomGenesis(data, ctx, []);
  })
  .transform(
    (
      input,
    ): [
      ReturnType<typeof toPublicClient>,
      CreateRollupPrepareDeploymentParamsConfigParams<'v3.2'>,
    ] => {
      const { parentChainRpcUrl, parentChainId, ...params } = input;
      return [toPublicClient(parentChainRpcUrl, findChain(parentChainId)), params];
    },
  );
