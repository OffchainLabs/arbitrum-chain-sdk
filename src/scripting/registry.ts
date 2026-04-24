import { z, ZodType } from 'zod';

import {
  getValidatorsSchema,
  getBatchPostersSchema,
  getKeysetsSchema,
  isAnyTrustSchema,
  createRollupFetchTransactionHashSchema,
  createRollupFetchCoreContractsSchema,
  getBridgeUiConfigSchema,
  upgradeExecutorFetchPrivilegedAccountsSchema,
  setAnyTrustFastConfirmerSchema,
  setValidKeysetSchema,
  createRollupSchema,
  createTokenBridgeSchema,
  createTokenBridgePrepareTransactionRequestSchema,
  createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
  setValidKeysetPrepareTransactionRequestSchema,
  createRollupPrepareTransactionRequestSchema,
  createSafePrepareTransactionRequestSchema,
  upgradeExecutorPrepareTransactionRequestSchema,
  createRollupEnoughCustomFeeTokenAllowanceSchema,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
  feeRouterDeployRewardDistributorSchema,
  feeRouterDeployChildToParentRewardRouterSchema,
  prepareChainConfigParamsSchema,
  prepareNodeConfigSchema,
  prepareKeysetSchema,
  prepareKeysetHashSchema,
  prepareDeploymentParamsConfigV21Schema,
  prepareDeploymentParamsConfigV32Schema,
  getDefaultsSchema,
  createRollupGetRetryablesFeesSchema,
  fetchAllowanceSchema,
  fetchDecimalsSchema,
  buildSetIsBatchPosterSchema,
  buildSetValidKeysetSchema,
  buildInvalidateKeysetHashSchema,
  buildSetMaxTimeVariationSchema,
  buildScheduleArbOSUpgradeSchema,
  isBatchPosterSchema,
  isValidKeysetHashSchema,
  getMaxTimeVariationSchema,
  createRollupPrepareDeploymentParamsConfigDefaultsSchema,
  parentChainIsArbitrumSchema,
  getConsensusReleaseByVersionSchema,
  getConsensusReleaseByWasmModuleRootSchema,
  isKnownWasmModuleRootSchema,
} from './schemas';

import { getValidators } from '../getValidators';
import { getBatchPosters } from '../getBatchPosters';
import { getKeysets } from '../getKeysets';
import { isAnyTrust } from '../isAnyTrust';
import { createRollupFetchTransactionHash } from '../createRollupFetchTransactionHash';
import { createRollupFetchCoreContracts } from '../createRollupFetchCoreContracts';
import { getBridgeUiConfig } from '../getBridgeUiConfig';
import { upgradeExecutorFetchPrivilegedAccounts } from '../upgradeExecutorFetchPrivilegedAccounts';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../setAnyTrustFastConfirmerPrepareTransactionRequest';
import { setValidKeyset } from '../setValidKeyset';
import { createRollup } from '../createRollup';
import { createTokenBridge } from '../createTokenBridge';
import { createTokenBridgePrepareTransactionRequest } from '../createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../setValidKeysetPrepareTransactionRequest';
import { createRollupPrepareTransactionRequest } from '../createRollupPrepareTransactionRequest';
import { createSafePrepareTransactionRequest } from '../createSafePrepareTransactionRequest';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { upgradeExecutorPrepareRemoveExecutorTransactionRequest } from '../upgradeExecutorPrepareRemoveExecutorTransactionRequest';
import { createRollupEnoughCustomFeeTokenAllowance } from '../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import { feeRouterDeployRewardDistributor } from '../feeRouterDeployRewardDistributor';
import { feeRouterDeployChildToParentRewardRouter } from '../feeRouterDeployChildToParentRewardRouter';
import { prepareChainConfig } from '../prepareChainConfig';
import { prepareNodeConfig } from '../prepareNodeConfig';
import { prepareKeyset } from '../prepareKeyset';
import { prepareKeysetHash } from '../prepareKeysetHash';
import { createRollupPrepareDeploymentParamsConfig } from '../createRollupPrepareDeploymentParamsConfig';
import { createRollupGetRetryablesFees } from '../createRollupGetRetryablesFees';
import { getDefaultConfirmPeriodBlocks } from '../getDefaultConfirmPeriodBlocks';
import { getDefaultChallengeGracePeriodBlocks } from '../getDefaultChallengeGracePeriodBlocks';
import { getDefaultMinimumAssertionPeriod } from '../getDefaultMinimumAssertionPeriod';
import { getDefaultValidatorAfkBlocks } from '../getDefaultValidatorAfkBlocks';
import { getDefaultSequencerInboxMaxTimeVariation } from '../getDefaultSequencerInboxMaxTimeVariation';
import { fetchAllowance, fetchDecimals } from '../utils/erc20';
import { buildSetIsBatchPoster } from '../actions/buildSetIsBatchPoster';
import { buildSetValidKeyset } from '../actions/buildSetValidKeyset';
import { buildInvalidateKeysetHash } from '../actions/buildInvalidateKeysetHash';
import { buildSetMaxTimeVariation } from '../actions/buildSetMaxTimeVariation';
import { buildScheduleArbOSUpgrade } from '../actions/buildScheduleArbOSUpgrade';
import { isBatchPoster } from '../actions/isBatchPoster';
import { isValidKeysetHash } from '../actions/isValidKeysetHash';
import { getMaxTimeVariation } from '../actions/getMaxTimeVariation';
import { createRollupPrepareDeploymentParamsConfigDefaults } from '../createRollupPrepareDeploymentParamsConfigDefaults';
import { parentChainIsArbitrum } from '../parentChainIsArbitrum';
import {
  getConsensusReleaseByVersion,
  getConsensusReleaseByWasmModuleRoot,
  isKnownWasmModuleRoot,
} from '../wasmModuleRoot';
import {
  schema as deployNewChainSchema,
  execute as deployNewChainExecute,
} from './examples/deployNewChain';
import {
  schema as transferOwnershipSchema,
  execute as transferOwnershipExecute,
} from './examples/transferOwnership';

/**
 * A scripting entry point: one schema + function pair exposed both as a CLI
 * subcommand and as a coverage-test target. Consumed by `cli.ts` (iterates
 * to build `runCli` commands) and `schemaCoverage.unit.test.ts` (iterates to
 * generate `it` blocks).
 */
export type RegistryEntry = {
  /** The CLI subcommand name and the coverage test label. */
  name: string;
  /**
   * Zod schema whose output is a tuple, so the parsed value can be spread
   * into `func`'s positional arguments.
   */
  schema: ZodType<readonly unknown[]>;
  /** The SDK function this entry wraps. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: (...args: any[]) => unknown;
};

const entry = <S extends ZodType<readonly unknown[]>>(
  name: string,
  schema: S,
  func: (...args: z.output<S>) => unknown,
): RegistryEntry => ({ name, schema, func });

export const registry: readonly RegistryEntry[] = [
  entry('getValidators', getValidatorsSchema, getValidators),
  entry('getBatchPosters', getBatchPostersSchema, getBatchPosters),
  entry('getKeysets', getKeysetsSchema, getKeysets),
  entry('isAnyTrust', isAnyTrustSchema, isAnyTrust),
  entry(
    'createRollupFetchTransactionHash',
    createRollupFetchTransactionHashSchema,
    createRollupFetchTransactionHash,
  ),
  entry(
    'createRollupFetchCoreContracts',
    createRollupFetchCoreContractsSchema,
    createRollupFetchCoreContracts,
  ),
  entry('getBridgeUiConfig', getBridgeUiConfigSchema, getBridgeUiConfig),
  entry(
    'upgradeExecutorFetchPrivilegedAccounts',
    upgradeExecutorFetchPrivilegedAccountsSchema,
    upgradeExecutorFetchPrivilegedAccounts,
  ),
  entry('fetchAllowance', fetchAllowanceSchema, fetchAllowance),
  entry('fetchDecimals', fetchDecimalsSchema, fetchDecimals),
  entry(
    'setAnyTrustFastConfirmer',
    setAnyTrustFastConfirmerSchema,
    setAnyTrustFastConfirmerPrepareTransactionRequest,
  ),
  entry('setValidKeyset', setValidKeysetSchema, setValidKeyset),
  entry('createRollup', createRollupSchema, createRollup),
  entry('createTokenBridge', createTokenBridgeSchema, createTokenBridge),
  entry(
    'createTokenBridgePrepareTransactionRequest',
    createTokenBridgePrepareTransactionRequestSchema,
    createTokenBridgePrepareTransactionRequest,
  ),
  entry(
    'createTokenBridgePrepareSetWethGatewayTransactionRequest',
    createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
    createTokenBridgePrepareSetWethGatewayTransactionRequest,
  ),
  entry(
    'setValidKeysetPrepareTransactionRequest',
    setValidKeysetPrepareTransactionRequestSchema,
    setValidKeysetPrepareTransactionRequest,
  ),
  entry(
    'createRollupPrepareTransactionRequest',
    createRollupPrepareTransactionRequestSchema,
    createRollupPrepareTransactionRequest,
  ),
  entry(
    'createSafePrepareTransactionRequest',
    createSafePrepareTransactionRequestSchema,
    createSafePrepareTransactionRequest,
  ),
  entry(
    'upgradeExecutorPrepareAddExecutor',
    upgradeExecutorPrepareTransactionRequestSchema,
    upgradeExecutorPrepareAddExecutorTransactionRequest,
  ),
  entry(
    'upgradeExecutorPrepareRemoveExecutor',
    upgradeExecutorPrepareTransactionRequestSchema,
    upgradeExecutorPrepareRemoveExecutorTransactionRequest,
  ),
  entry(
    'createRollupEnoughCustomFeeTokenAllowance',
    createRollupEnoughCustomFeeTokenAllowanceSchema,
    createRollupEnoughCustomFeeTokenAllowance,
  ),
  entry(
    'createRollupPrepareCustomFeeTokenApprovalTransactionRequest',
    createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
    createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  entry(
    'createTokenBridgeEnoughCustomFeeTokenAllowance',
    createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
    createTokenBridgeEnoughCustomFeeTokenAllowance,
  ),
  entry(
    'createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest',
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  entry(
    'feeRouterDeployRewardDistributor',
    feeRouterDeployRewardDistributorSchema,
    feeRouterDeployRewardDistributor,
  ),
  entry(
    'feeRouterDeployChildToParentRewardRouter',
    feeRouterDeployChildToParentRewardRouterSchema,
    feeRouterDeployChildToParentRewardRouter,
  ),
  entry('prepareChainConfig', prepareChainConfigParamsSchema, prepareChainConfig),
  entry('prepareNodeConfig', prepareNodeConfigSchema, prepareNodeConfig),
  entry('prepareKeyset', prepareKeysetSchema, prepareKeyset),
  entry('prepareKeysetHash', prepareKeysetHashSchema, prepareKeysetHash),
  entry(
    'prepareDeploymentParamsConfigV21',
    prepareDeploymentParamsConfigV21Schema,
    createRollupPrepareDeploymentParamsConfig,
  ),
  entry(
    'prepareDeploymentParamsConfigV32',
    prepareDeploymentParamsConfigV32Schema,
    createRollupPrepareDeploymentParamsConfig,
  ),
  entry(
    'createRollupGetRetryablesFees',
    createRollupGetRetryablesFeesSchema,
    createRollupGetRetryablesFees,
  ),
  entry('getDefaultConfirmPeriodBlocks', getDefaultsSchema, getDefaultConfirmPeriodBlocks),
  entry(
    'getDefaultChallengeGracePeriodBlocks',
    getDefaultsSchema,
    getDefaultChallengeGracePeriodBlocks,
  ),
  entry('getDefaultMinimumAssertionPeriod', getDefaultsSchema, getDefaultMinimumAssertionPeriod),
  entry('getDefaultValidatorAfkBlocks', getDefaultsSchema, getDefaultValidatorAfkBlocks),
  entry(
    'getDefaultSequencerInboxMaxTimeVariation',
    getDefaultsSchema,
    getDefaultSequencerInboxMaxTimeVariation,
  ),
  entry('buildSetIsBatchPoster', buildSetIsBatchPosterSchema, buildSetIsBatchPoster),
  entry('buildSetValidKeyset', buildSetValidKeysetSchema, buildSetValidKeyset),
  entry('buildInvalidateKeysetHash', buildInvalidateKeysetHashSchema, buildInvalidateKeysetHash),
  entry('buildSetMaxTimeVariation', buildSetMaxTimeVariationSchema, buildSetMaxTimeVariation),
  entry('buildScheduleArbOSUpgrade', buildScheduleArbOSUpgradeSchema, buildScheduleArbOSUpgrade),
  entry('isBatchPoster', isBatchPosterSchema, isBatchPoster),
  entry('isValidKeysetHash', isValidKeysetHashSchema, isValidKeysetHash),
  entry('getMaxTimeVariation', getMaxTimeVariationSchema, getMaxTimeVariation),
  entry(
    'createRollupPrepareDeploymentParamsConfigDefaults',
    createRollupPrepareDeploymentParamsConfigDefaultsSchema,
    createRollupPrepareDeploymentParamsConfigDefaults as (
      version?: 'v2.1' | 'v3.2',
    ) => ReturnType<typeof createRollupPrepareDeploymentParamsConfigDefaults>,
  ),
  entry('parentChainIsArbitrum', parentChainIsArbitrumSchema, parentChainIsArbitrum),
  entry(
    'getConsensusReleaseByVersion',
    getConsensusReleaseByVersionSchema,
    getConsensusReleaseByVersion,
  ),
  entry(
    'getConsensusReleaseByWasmModuleRoot',
    getConsensusReleaseByWasmModuleRootSchema,
    getConsensusReleaseByWasmModuleRoot,
  ),
  entry('isKnownWasmModuleRoot', isKnownWasmModuleRootSchema, isKnownWasmModuleRoot),

  entry('deployNewChain', deployNewChainSchema.transform((i) => [i] as const), deployNewChainExecute),
  entry(
    'transferOwnership',
    transferOwnershipSchema.transform((i) => [i] as const),
    transferOwnershipExecute,
  ),
];
