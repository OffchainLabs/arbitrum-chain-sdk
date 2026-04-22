import { runCli, cmd } from './scriptUtils';

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
  buildSetAllowListSchema,
  buildSetAllowListEnabledSchema,
  isAllowListEnabledSchema,
  isAllowedSchema,
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
import { buildSetAllowList } from '../actions/buildSetAllowList';
import { buildSetAllowListEnabled } from '../actions/buildSetAllowListEnabled';
import { isAllowListEnabled } from '../actions/isAllowListEnabled';
import { isAllowed } from '../actions/isAllowed';
import { createRollupPrepareDeploymentParamsConfigDefaults } from '../createRollupPrepareDeploymentParamsConfigDefaults';
import { parentChainIsArbitrum } from '../parentChainIsArbitrum';
import {
  getConsensusReleaseByVersion,
  getConsensusReleaseByWasmModuleRoot,
  isKnownWasmModuleRoot,
} from '../wasmModuleRoot';

import {
  schema as deployNewChainSchema,
  execute as deployNewChain,
} from './workflows/deployNewChain';
import {
  schema as createTokenBridgeAndWethGatewaySchema,
  execute as createTokenBridgeAndWethGateway,
} from './workflows/createTokenBridgeAndWethGateway';
import {
  schema as transferOwnershipSchema,
  execute as transferOwnership,
} from './workflows/transferOwnership';
import {
  schema as deployFullChainSchema,
  execute as deployFullChain,
} from './workflows/deployFullChain';

const toTuple = <T>(input: T) => [input] as const;

runCli('chain-sdk', {
  getValidators: cmd(getValidatorsSchema, getValidators),
  getBatchPosters: cmd(getBatchPostersSchema, getBatchPosters),
  getKeysets: cmd(getKeysetsSchema, getKeysets),
  isAnyTrust: cmd(isAnyTrustSchema, isAnyTrust),
  createRollupFetchTransactionHash: cmd(
    createRollupFetchTransactionHashSchema,
    createRollupFetchTransactionHash,
  ),
  createRollupFetchCoreContracts: cmd(
    createRollupFetchCoreContractsSchema,
    createRollupFetchCoreContracts,
  ),
  getBridgeUiConfig: cmd(getBridgeUiConfigSchema, getBridgeUiConfig),
  upgradeExecutorFetchPrivilegedAccounts: cmd(
    upgradeExecutorFetchPrivilegedAccountsSchema,
    upgradeExecutorFetchPrivilegedAccounts,
  ),
  fetchAllowance: cmd(fetchAllowanceSchema, fetchAllowance),
  fetchDecimals: cmd(fetchDecimalsSchema, fetchDecimals),

  setAnyTrustFastConfirmer: cmd(
    setAnyTrustFastConfirmerSchema,
    setAnyTrustFastConfirmerPrepareTransactionRequest,
  ),
  setValidKeyset: cmd(setValidKeysetSchema, setValidKeyset),
  createRollup: cmd(createRollupSchema, createRollup),
  createTokenBridge: cmd(createTokenBridgeSchema, createTokenBridge),
  createTokenBridgePrepareTransactionRequest: cmd(
    createTokenBridgePrepareTransactionRequestSchema,
    createTokenBridgePrepareTransactionRequest,
  ),
  createTokenBridgePrepareSetWethGatewayTransactionRequest: cmd(
    createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
    createTokenBridgePrepareSetWethGatewayTransactionRequest,
  ),
  setValidKeysetPrepareTransactionRequest: cmd(
    setValidKeysetPrepareTransactionRequestSchema,
    setValidKeysetPrepareTransactionRequest,
  ),
  createRollupPrepareTransactionRequest: cmd(
    createRollupPrepareTransactionRequestSchema,
    createRollupPrepareTransactionRequest,
  ),
  createSafePrepareTransactionRequest: cmd(
    createSafePrepareTransactionRequestSchema,
    createSafePrepareTransactionRequest,
  ),
  upgradeExecutorPrepareAddExecutor: cmd(
    upgradeExecutorPrepareTransactionRequestSchema,
    upgradeExecutorPrepareAddExecutorTransactionRequest,
  ),
  upgradeExecutorPrepareRemoveExecutor: cmd(
    upgradeExecutorPrepareTransactionRequestSchema,
    upgradeExecutorPrepareRemoveExecutorTransactionRequest,
  ),
  createRollupEnoughCustomFeeTokenAllowance: cmd(
    createRollupEnoughCustomFeeTokenAllowanceSchema,
    createRollupEnoughCustomFeeTokenAllowance,
  ),
  createRollupPrepareCustomFeeTokenApprovalTransactionRequest: cmd(
    createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
    createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  createTokenBridgeEnoughCustomFeeTokenAllowance: cmd(
    createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
    createTokenBridgeEnoughCustomFeeTokenAllowance,
  ),
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest: cmd(
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
    createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
  ),
  feeRouterDeployRewardDistributor: cmd(
    feeRouterDeployRewardDistributorSchema,
    feeRouterDeployRewardDistributor,
  ),
  feeRouterDeployChildToParentRewardRouter: cmd(
    feeRouterDeployChildToParentRewardRouterSchema,
    feeRouterDeployChildToParentRewardRouter,
  ),

  prepareChainConfig: cmd(prepareChainConfigParamsSchema, prepareChainConfig),
  prepareNodeConfig: cmd(prepareNodeConfigSchema, prepareNodeConfig),
  prepareKeyset: cmd(prepareKeysetSchema, prepareKeyset),
  prepareKeysetHash: cmd(prepareKeysetHashSchema, prepareKeysetHash),
  prepareDeploymentParamsConfigV21: cmd(
    prepareDeploymentParamsConfigV21Schema,
    createRollupPrepareDeploymentParamsConfig,
  ),
  prepareDeploymentParamsConfigV32: cmd(
    prepareDeploymentParamsConfigV32Schema,
    createRollupPrepareDeploymentParamsConfig,
  ),
  createRollupGetRetryablesFees: cmd(
    createRollupGetRetryablesFeesSchema,
    createRollupGetRetryablesFees,
  ),

  getDefaultConfirmPeriodBlocks: cmd(getDefaultsSchema, getDefaultConfirmPeriodBlocks),
  getDefaultChallengeGracePeriodBlocks: cmd(
    getDefaultsSchema,
    getDefaultChallengeGracePeriodBlocks,
  ),
  getDefaultMinimumAssertionPeriod: cmd(getDefaultsSchema, getDefaultMinimumAssertionPeriod),
  getDefaultValidatorAfkBlocks: cmd(getDefaultsSchema, getDefaultValidatorAfkBlocks),
  getDefaultSequencerInboxMaxTimeVariation: cmd(
    getDefaultsSchema,
    getDefaultSequencerInboxMaxTimeVariation,
  ),

  deployNewChain: cmd(deployNewChainSchema.transform(toTuple), deployNewChain),
  createTokenBridgeAndWethGateway: cmd(
    createTokenBridgeAndWethGatewaySchema.transform(toTuple),
    createTokenBridgeAndWethGateway,
  ),
  transferOwnership: cmd(transferOwnershipSchema.transform(toTuple), transferOwnership),
  deployFullChain: cmd(deployFullChainSchema.transform(toTuple), deployFullChain),

  buildSetIsBatchPoster: cmd(buildSetIsBatchPosterSchema, buildSetIsBatchPoster),
  buildSetValidKeyset: cmd(buildSetValidKeysetSchema, buildSetValidKeyset),
  buildInvalidateKeysetHash: cmd(buildInvalidateKeysetHashSchema, buildInvalidateKeysetHash),
  buildSetMaxTimeVariation: cmd(buildSetMaxTimeVariationSchema, buildSetMaxTimeVariation),
  buildScheduleArbOSUpgrade: cmd(buildScheduleArbOSUpgradeSchema, buildScheduleArbOSUpgrade),
  isBatchPoster: cmd(isBatchPosterSchema, isBatchPoster),
  isValidKeysetHash: cmd(isValidKeysetHashSchema, isValidKeysetHash),
  getMaxTimeVariation: cmd(getMaxTimeVariationSchema, getMaxTimeVariation),

  createRollupPrepareDeploymentParamsConfigDefaults: cmd(
    createRollupPrepareDeploymentParamsConfigDefaultsSchema,
    createRollupPrepareDeploymentParamsConfigDefaults as (
      version?: 'v2.1' | 'v3.2',
    ) => ReturnType<typeof createRollupPrepareDeploymentParamsConfigDefaults>,
  ),
  parentChainIsArbitrum: cmd(parentChainIsArbitrumSchema, parentChainIsArbitrum),
  getConsensusReleaseByVersion: cmd(
    getConsensusReleaseByVersionSchema,
    getConsensusReleaseByVersion,
  ),
  getConsensusReleaseByWasmModuleRoot: cmd(
    getConsensusReleaseByWasmModuleRootSchema,
    getConsensusReleaseByWasmModuleRoot,
  ),
  isKnownWasmModuleRoot: cmd(isKnownWasmModuleRootSchema, isKnownWasmModuleRoot),

  buildSetAllowList: cmd(buildSetAllowListSchema, buildSetAllowList),
  buildSetAllowListEnabled: cmd(buildSetAllowListEnabledSchema, buildSetAllowListEnabled),
  isAllowListEnabled: cmd(isAllowListEnabledSchema, isAllowListEnabled),
  isAllowed: cmd(isAllowedSchema, isAllowed),
});
