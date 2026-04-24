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
export type Command = {
  /** The CLI subcommand name and the coverage test label. */
  name: string;
  /**
   * Zod schema whose output is a tuple, so the parsed value can be spread
   * into `func`'s positional arguments.
   */
  schema: ZodType<readonly unknown[]>;
  /** The SDK function this command wraps. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: (...args: any[]) => unknown;
};

/**
 * Factory that ties each command's `schema` to its `func` at the call site
 * so TypeScript rejects mismatched pairings. A plain object literal typed
 * as `Command` would widen `func` to `(...args: any[]) => unknown`,
 * silently accepting a function whose arguments don't line up with
 * `z.output<schema>`. Captures the specific `S` here, then returns the
 * widened `Command` so all entries share one array type.
 */
const command = <S extends ZodType<readonly unknown[]>>(
  name: string,
  schema: S,
  func: (...args: z.output<S>) => unknown,
): Command => ({ name, schema, func });

export const commands: readonly Command[] = [
  command('getValidators', getValidatorsSchema, getValidators),
  command('getBatchPosters', getBatchPostersSchema, getBatchPosters),
  command('getKeysets', getKeysetsSchema, getKeysets),
  command('isAnyTrust', isAnyTrustSchema, isAnyTrust),
  command(
    'createRollupFetchTransactionHash',
    createRollupFetchTransactionHashSchema,
    createRollupFetchTransactionHash,
  ),
  command(
    'createRollupFetchCoreContracts',
    createRollupFetchCoreContractsSchema,
    createRollupFetchCoreContracts,
  ),
  command('getBridgeUiConfig', getBridgeUiConfigSchema, getBridgeUiConfig),
  command(
    'upgradeExecutorFetchPrivilegedAccounts',
    upgradeExecutorFetchPrivilegedAccountsSchema,
    upgradeExecutorFetchPrivilegedAccounts,
  ),
  command('fetchAllowance', fetchAllowanceSchema, fetchAllowance),
  command('fetchDecimals', fetchDecimalsSchema, fetchDecimals),
  command(
    'setAnyTrustFastConfirmer',
    setAnyTrustFastConfirmerSchema,
    setAnyTrustFastConfirmerPrepareTransactionRequest,
  ),
  command('setValidKeyset', setValidKeysetSchema, setValidKeyset),
  command('createRollup', createRollupSchema, createRollup),
  command('createTokenBridge', createTokenBridgeSchema, createTokenBridge),
  command(
    'createTokenBridgePrepareTransactionRequest',
    createTokenBridgePrepareTransactionRequestSchema,
    createTokenBridgePrepareTransactionRequest,
  ),
  command(
    'createTokenBridgePrepareSetWethGatewayTransactionRequest',
    createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
    createTokenBridgePrepareSetWethGatewayTransactionRequest,
  ),
  command(
    'setValidKeysetPrepareTransactionRequest',
    setValidKeysetPrepareTransactionRequestSchema,
    setValidKeysetPrepareTransactionRequest,
  ),
  command(
    'createRollupPrepareTransactionRequest',
    createRollupPrepareTransactionRequestSchema,
    createRollupPrepareTransactionRequest,
  ),
  command(
    'createSafePrepareTransactionRequest',
    createSafePrepareTransactionRequestSchema,
    createSafePrepareTransactionRequest,
  ),
  command(
    'upgradeExecutorPrepareAddExecutor',
    upgradeExecutorPrepareTransactionRequestSchema,
    upgradeExecutorPrepareAddExecutorTransactionRequest,
  ),
  command(
    'upgradeExecutorPrepareRemoveExecutor',
    upgradeExecutorPrepareTransactionRequestSchema,
    upgradeExecutorPrepareRemoveExecutorTransactionRequest,
  ),
  command(
    'createRollupEnoughCustomFeeTokenAllowance',
    createRollupEnoughCustomFeeTokenAllowanceSchema,
    createRollupEnoughCustomFeeTokenAllowance,
  ),
  command(
    'createRollupPrepareCustomFeeTokenApprovalTransactionRequest',
    createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
    createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  command(
    'createTokenBridgeEnoughCustomFeeTokenAllowance',
    createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
    createTokenBridgeEnoughCustomFeeTokenAllowance,
  ),
  command(
    'createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest',
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  command(
    'feeRouterDeployRewardDistributor',
    feeRouterDeployRewardDistributorSchema,
    feeRouterDeployRewardDistributor,
  ),
  command(
    'feeRouterDeployChildToParentRewardRouter',
    feeRouterDeployChildToParentRewardRouterSchema,
    feeRouterDeployChildToParentRewardRouter,
  ),
  command('prepareChainConfig', prepareChainConfigParamsSchema, prepareChainConfig),
  command('prepareNodeConfig', prepareNodeConfigSchema, prepareNodeConfig),
  command('prepareKeyset', prepareKeysetSchema, prepareKeyset),
  command('prepareKeysetHash', prepareKeysetHashSchema, prepareKeysetHash),
  command(
    'prepareDeploymentParamsConfigV21',
    prepareDeploymentParamsConfigV21Schema,
    createRollupPrepareDeploymentParamsConfig,
  ),
  command(
    'prepareDeploymentParamsConfigV32',
    prepareDeploymentParamsConfigV32Schema,
    createRollupPrepareDeploymentParamsConfig,
  ),
  command(
    'createRollupGetRetryablesFees',
    createRollupGetRetryablesFeesSchema,
    createRollupGetRetryablesFees,
  ),
  command('getDefaultConfirmPeriodBlocks', getDefaultsSchema, getDefaultConfirmPeriodBlocks),
  command(
    'getDefaultChallengeGracePeriodBlocks',
    getDefaultsSchema,
    getDefaultChallengeGracePeriodBlocks,
  ),
  command('getDefaultMinimumAssertionPeriod', getDefaultsSchema, getDefaultMinimumAssertionPeriod),
  command('getDefaultValidatorAfkBlocks', getDefaultsSchema, getDefaultValidatorAfkBlocks),
  command(
    'getDefaultSequencerInboxMaxTimeVariation',
    getDefaultsSchema,
    getDefaultSequencerInboxMaxTimeVariation,
  ),
  command('buildSetIsBatchPoster', buildSetIsBatchPosterSchema, buildSetIsBatchPoster),
  command('buildSetValidKeyset', buildSetValidKeysetSchema, buildSetValidKeyset),
  command('buildInvalidateKeysetHash', buildInvalidateKeysetHashSchema, buildInvalidateKeysetHash),
  command('buildSetMaxTimeVariation', buildSetMaxTimeVariationSchema, buildSetMaxTimeVariation),
  command('buildScheduleArbOSUpgrade', buildScheduleArbOSUpgradeSchema, buildScheduleArbOSUpgrade),
  command('isBatchPoster', isBatchPosterSchema, isBatchPoster),
  command('isValidKeysetHash', isValidKeysetHashSchema, isValidKeysetHash),
  command('getMaxTimeVariation', getMaxTimeVariationSchema, getMaxTimeVariation),
  command(
    'createRollupPrepareDeploymentParamsConfigDefaults',
    createRollupPrepareDeploymentParamsConfigDefaultsSchema,
    createRollupPrepareDeploymentParamsConfigDefaults as (
      version?: 'v2.1' | 'v3.2',
    ) => ReturnType<typeof createRollupPrepareDeploymentParamsConfigDefaults>,
  ),
  command('parentChainIsArbitrum', parentChainIsArbitrumSchema, parentChainIsArbitrum),
  command(
    'getConsensusReleaseByVersion',
    getConsensusReleaseByVersionSchema,
    getConsensusReleaseByVersion,
  ),
  command(
    'getConsensusReleaseByWasmModuleRoot',
    getConsensusReleaseByWasmModuleRootSchema,
    getConsensusReleaseByWasmModuleRoot,
  ),
  command('isKnownWasmModuleRoot', isKnownWasmModuleRootSchema, isKnownWasmModuleRoot),

  command('deployNewChain', deployNewChainSchema.transform((i) => [i] as const), deployNewChainExecute),
  command(
    'transferOwnership',
    transferOwnershipSchema.transform((i) => [i] as const),
    transferOwnershipExecute,
  ),
];
