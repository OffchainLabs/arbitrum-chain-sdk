import { runCli, cmd } from './scriptUtils';

import {
  getValidatorsSchema,
  getValidatorsResolver,
  getBatchPostersSchema,
  getBatchPostersResolver,
  getKeysetsSchema,
  getKeysetsResolver,
  isAnyTrustSchema,
  createRollupFetchTransactionHashSchema,
  createRollupFetchTransactionHashResolver,
  createRollupFetchCoreContractsSchema,
  createRollupFetchCoreContractsResolver,
  isTokenBridgeDeployedSchema,
  isTokenBridgeDeployedTransform,
  getBridgeUiConfigSchema,
  getBridgeUiConfigTransform,
  upgradeExecutorFetchPrivilegedAccountsSchema,
  upgradeExecutorFetchPrivilegedAccountsResolver,
  setAnyTrustFastConfirmerSchema,
  setAnyTrustFastConfirmerResolver,
  setValidKeysetSchema,
  setValidKeysetTransform,
  createRollupSchema,
  createRollupResolver,
  createTokenBridgeSchema,
  createTokenBridgeResolver,
  createTokenBridgePrepareTransactionRequestSchema,
  createTokenBridgePrepareTransactionRequestResolver,
  createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
  createTokenBridgePrepareSetWethGatewayTransactionRequestResolver,
  setValidKeysetPrepareTransactionRequestSchema,
  setValidKeysetPrepareTransactionRequestResolver,
  createRollupPrepareTransactionRequestSchema,
  createRollupPrepareTransactionRequestResolver,
  createSafePrepareTransactionRequestSchema,
  createSafePrepareTransactionRequestResolver,
  upgradeExecutorPrepareTransactionRequestSchema,
  upgradeExecutorPrepareTransactionRequestResolver,
  createRollupEnoughCustomFeeTokenAllowanceSchema,
  createRollupEnoughCustomFeeTokenAllowanceResolver,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestResolver,
  createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
  createTokenBridgeEnoughCustomFeeTokenAllowanceResolver,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestResolver,
  feeRouterDeployRewardDistributorSchema,
  feeRouterDeployRewardDistributorResolver,
  feeRouterDeployChildToParentRewardRouterSchema,
  feeRouterDeployChildToParentRewardRouterResolver,
  prepareChainConfigParamsSchema,
  prepareChainConfigTransform,
  prepareNodeConfigSchema,
  prepareNodeConfigTransform,
  prepareKeysetSchema,
  prepareKeysetTransform,
  prepareKeysetHashSchema,
  prepareKeysetHashTransform,
  prepareDeploymentParamsConfigV21Schema,
  prepareDeploymentParamsConfigV21Transform,
  prepareDeploymentParamsConfigV32Schema,
  prepareDeploymentParamsConfigV32Transform,
  getDefaultsSchema,
  getDefaultsTransform,
  createRollupGetRetryablesFeesSchema,
  createRollupGetRetryablesFeesTransform,
  fetchAllowanceSchema,
  fetchAllowanceResolver,
  fetchDecimalsSchema,
  fetchDecimalsResolver,
  buildSetIsBatchPosterSchema,
  buildSetIsBatchPosterTransform,
  buildSetValidKeysetSchema,
  buildSetValidKeysetTransform,
  buildInvalidateKeysetHashSchema,
  buildInvalidateKeysetHashTransform,
  buildSetMaxTimeVariationSchema,
  buildSetMaxTimeVariationTransform,
  buildScheduleArbOSUpgradeSchema,
  buildScheduleArbOSUpgradeTransform,
  isBatchPosterSchema,
  isBatchPosterTransform,
  isValidKeysetHashSchema,
  isValidKeysetHashTransform,
  getMaxTimeVariationSchema,
  getMaxTimeVariationResolver,
  createRollupPrepareDeploymentParamsConfigDefaultsSchema,
  createRollupPrepareDeploymentParamsConfigDefaultsTransform,
  parentChainIsArbitrumSchema,
  parentChainIsArbitrumTransform,
  getConsensusReleaseByVersionSchema,
  getConsensusReleaseByVersionTransform,
  getConsensusReleaseByWasmModuleRootSchema,
  getConsensusReleaseByWasmModuleRootTransform,
  isKnownWasmModuleRootSchema,
  isKnownWasmModuleRootTransform,
} from './schemas';

import { getValidators } from '../getValidators';
import { getBatchPosters } from '../getBatchPosters';
import { getKeysets } from '../getKeysets';
import { isAnyTrust } from '../isAnyTrust';
import { createRollupFetchTransactionHash } from '../createRollupFetchTransactionHash';
import { createRollupFetchCoreContracts } from '../createRollupFetchCoreContracts';
import { isTokenBridgeDeployed } from '../isTokenBridgeDeployed';
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

runCli('chain-sdk', {
  getValidators: cmd(getValidatorsSchema.transform(getValidatorsResolver), getValidators),
  getBatchPosters: cmd(getBatchPostersSchema.transform(getBatchPostersResolver), getBatchPosters),
  getKeysets: cmd(getKeysetsSchema.transform(getKeysetsResolver), getKeysets),
  isAnyTrust: cmd(isAnyTrustSchema, isAnyTrust),
  createRollupFetchTransactionHash: cmd(
    createRollupFetchTransactionHashSchema.transform(createRollupFetchTransactionHashResolver),
    createRollupFetchTransactionHash,
  ),
  createRollupFetchCoreContracts: cmd(
    createRollupFetchCoreContractsSchema.transform(createRollupFetchCoreContractsResolver),
    createRollupFetchCoreContracts,
  ),
  isTokenBridgeDeployed: cmd(
    isTokenBridgeDeployedSchema.transform(isTokenBridgeDeployedTransform),
    isTokenBridgeDeployed,
  ),
  getBridgeUiConfig: cmd(
    getBridgeUiConfigSchema.transform(getBridgeUiConfigTransform),
    getBridgeUiConfig,
  ),
  upgradeExecutorFetchPrivilegedAccounts: cmd(
    upgradeExecutorFetchPrivilegedAccountsSchema.transform(
      upgradeExecutorFetchPrivilegedAccountsResolver,
    ),
    upgradeExecutorFetchPrivilegedAccounts,
  ),
  fetchAllowance: cmd(fetchAllowanceSchema.transform(fetchAllowanceResolver), fetchAllowance),
  fetchDecimals: cmd(fetchDecimalsSchema.transform(fetchDecimalsResolver), fetchDecimals),

  setAnyTrustFastConfirmer: cmd(
    setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerResolver),
    setAnyTrustFastConfirmerPrepareTransactionRequest,
  ),
  setValidKeyset: cmd(setValidKeysetSchema.transform(setValidKeysetTransform), setValidKeyset),
  createRollup: cmd(createRollupSchema.transform(createRollupResolver), createRollup),
  createTokenBridge: cmd(
    createTokenBridgeSchema.transform(createTokenBridgeResolver),
    createTokenBridge,
  ),
  createTokenBridgePrepareTransactionRequest: cmd(
    createTokenBridgePrepareTransactionRequestSchema.transform(
      createTokenBridgePrepareTransactionRequestResolver,
    ),
    createTokenBridgePrepareTransactionRequest,
  ),
  createTokenBridgePrepareSetWethGatewayTransactionRequest: cmd(
    createTokenBridgePrepareSetWethGatewayTransactionRequestSchema.transform(
      createTokenBridgePrepareSetWethGatewayTransactionRequestResolver,
    ),
    createTokenBridgePrepareSetWethGatewayTransactionRequest,
  ),
  setValidKeysetPrepareTransactionRequest: cmd(
    setValidKeysetPrepareTransactionRequestSchema.transform(
      setValidKeysetPrepareTransactionRequestResolver,
    ),
    setValidKeysetPrepareTransactionRequest,
  ),
  createRollupPrepareTransactionRequest: cmd(
    createRollupPrepareTransactionRequestSchema.transform(
      createRollupPrepareTransactionRequestResolver,
    ),
    createRollupPrepareTransactionRequest,
  ),
  createSafePrepareTransactionRequest: cmd(
    createSafePrepareTransactionRequestSchema.transform(
      createSafePrepareTransactionRequestResolver,
    ),
    createSafePrepareTransactionRequest,
  ),
  upgradeExecutorPrepareAddExecutor: cmd(
    upgradeExecutorPrepareTransactionRequestSchema.transform(
      upgradeExecutorPrepareTransactionRequestResolver,
    ),
    upgradeExecutorPrepareAddExecutorTransactionRequest,
  ),
  upgradeExecutorPrepareRemoveExecutor: cmd(
    upgradeExecutorPrepareTransactionRequestSchema.transform(
      upgradeExecutorPrepareTransactionRequestResolver,
    ),
    upgradeExecutorPrepareRemoveExecutorTransactionRequest,
  ),
  createRollupEnoughCustomFeeTokenAllowance: cmd(
    createRollupEnoughCustomFeeTokenAllowanceSchema.transform(
      createRollupEnoughCustomFeeTokenAllowanceResolver,
    ),
    createRollupEnoughCustomFeeTokenAllowance,
  ),
  createRollupPrepareCustomFeeTokenApprovalTransactionRequest: cmd(
    createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(
      createRollupPrepareCustomFeeTokenApprovalTransactionRequestResolver,
    ),
    createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  createTokenBridgeEnoughCustomFeeTokenAllowance: cmd(
    createTokenBridgeEnoughCustomFeeTokenAllowanceSchema.transform(
      createTokenBridgeEnoughCustomFeeTokenAllowanceResolver,
    ),
    createTokenBridgeEnoughCustomFeeTokenAllowance,
  ),
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest: cmd(
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestResolver,
    ),
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  feeRouterDeployRewardDistributor: cmd(
    feeRouterDeployRewardDistributorSchema.transform(feeRouterDeployRewardDistributorResolver),
    feeRouterDeployRewardDistributor,
  ),
  feeRouterDeployChildToParentRewardRouter: cmd(
    feeRouterDeployChildToParentRewardRouterSchema.transform(
      feeRouterDeployChildToParentRewardRouterResolver,
    ),
    feeRouterDeployChildToParentRewardRouter,
  ),

  prepareChainConfig: cmd(
    prepareChainConfigParamsSchema.transform(prepareChainConfigTransform),
    prepareChainConfig,
  ),
  prepareNodeConfig: cmd(
    prepareNodeConfigSchema.transform(prepareNodeConfigTransform),
    prepareNodeConfig,
  ),
  prepareKeyset: cmd(prepareKeysetSchema.transform(prepareKeysetTransform), prepareKeyset),
  prepareKeysetHash: cmd(
    prepareKeysetHashSchema.transform(prepareKeysetHashTransform),
    prepareKeysetHash,
  ),
  prepareDeploymentParamsConfigV21: cmd(
    prepareDeploymentParamsConfigV21Schema.transform(prepareDeploymentParamsConfigV21Transform),
    createRollupPrepareDeploymentParamsConfig,
  ),
  prepareDeploymentParamsConfigV32: cmd(
    prepareDeploymentParamsConfigV32Schema.transform(prepareDeploymentParamsConfigV32Transform),
    createRollupPrepareDeploymentParamsConfig,
  ),
  createRollupGetRetryablesFees: cmd(
    createRollupGetRetryablesFeesSchema.transform(createRollupGetRetryablesFeesTransform),
    createRollupGetRetryablesFees,
  ),

  getDefaultConfirmPeriodBlocks: cmd(
    getDefaultsSchema.transform(getDefaultsTransform),
    getDefaultConfirmPeriodBlocks,
  ),
  getDefaultChallengeGracePeriodBlocks: cmd(
    getDefaultsSchema.transform(getDefaultsTransform),
    getDefaultChallengeGracePeriodBlocks,
  ),
  getDefaultMinimumAssertionPeriod: cmd(
    getDefaultsSchema.transform(getDefaultsTransform),
    getDefaultMinimumAssertionPeriod,
  ),
  getDefaultValidatorAfkBlocks: cmd(
    getDefaultsSchema.transform(getDefaultsTransform),
    getDefaultValidatorAfkBlocks,
  ),
  getDefaultSequencerInboxMaxTimeVariation: cmd(
    getDefaultsSchema.transform(getDefaultsTransform),
    getDefaultSequencerInboxMaxTimeVariation,
  ),

  buildSetIsBatchPoster: cmd(
    buildSetIsBatchPosterSchema.transform(buildSetIsBatchPosterTransform),
    buildSetIsBatchPoster,
  ),
  buildSetValidKeyset: cmd(
    buildSetValidKeysetSchema.transform(buildSetValidKeysetTransform),
    buildSetValidKeyset,
  ),
  buildInvalidateKeysetHash: cmd(
    buildInvalidateKeysetHashSchema.transform(buildInvalidateKeysetHashTransform),
    buildInvalidateKeysetHash,
  ),
  buildSetMaxTimeVariation: cmd(
    buildSetMaxTimeVariationSchema.transform(buildSetMaxTimeVariationTransform),
    buildSetMaxTimeVariation,
  ),
  buildScheduleArbOSUpgrade: cmd(
    buildScheduleArbOSUpgradeSchema.transform(buildScheduleArbOSUpgradeTransform),
    buildScheduleArbOSUpgrade,
  ),
  isBatchPoster: cmd(isBatchPosterSchema.transform(isBatchPosterTransform), isBatchPoster),
  isValidKeysetHash: cmd(
    isValidKeysetHashSchema.transform(isValidKeysetHashTransform),
    isValidKeysetHash,
  ),
  getMaxTimeVariation: cmd(
    getMaxTimeVariationSchema.transform(getMaxTimeVariationResolver),
    getMaxTimeVariation,
  ),

  createRollupPrepareDeploymentParamsConfigDefaults: cmd(
    createRollupPrepareDeploymentParamsConfigDefaultsSchema.transform(
      createRollupPrepareDeploymentParamsConfigDefaultsTransform,
    ),
    createRollupPrepareDeploymentParamsConfigDefaults as (
      version?: 'v2.1' | 'v3.2',
    ) => ReturnType<typeof createRollupPrepareDeploymentParamsConfigDefaults>,
  ),
  parentChainIsArbitrum: cmd(
    parentChainIsArbitrumSchema.transform(parentChainIsArbitrumTransform),
    parentChainIsArbitrum,
  ),
  getConsensusReleaseByVersion: cmd(
    getConsensusReleaseByVersionSchema.transform(getConsensusReleaseByVersionTransform),
    getConsensusReleaseByVersion,
  ),
  getConsensusReleaseByWasmModuleRoot: cmd(
    getConsensusReleaseByWasmModuleRootSchema.transform(
      getConsensusReleaseByWasmModuleRootTransform,
    ),
    getConsensusReleaseByWasmModuleRoot,
  ),
  isKnownWasmModuleRoot: cmd(
    isKnownWasmModuleRootSchema.transform(isKnownWasmModuleRootTransform),
    isKnownWasmModuleRoot,
  ),
});
