import { describe, it } from 'vitest';
import { mocks, assertSchemaCoverage } from './schemaCoverage';

import { getValidatorsSchema } from './schemas/getValidators';
import { getValidators } from '../getValidators';
import { getKeysetsSchema } from './schemas/getKeysets';
import { getKeysets } from '../getKeysets';
import { getBatchPostersSchema } from './schemas/getBatchPosters';
import { getBatchPosters } from '../getBatchPosters';
import { isAnyTrustSchema } from './schemas/isAnyTrust';
import { isAnyTrust } from '../isAnyTrust';
import { prepareKeysetHashSchema } from './schemas/prepareKeysetHash';
import { prepareKeysetHash } from '../prepareKeysetHash';
import { prepareKeysetSchema } from './schemas/prepareKeyset';
import { prepareKeyset } from '../prepareKeyset';
import { prepareChainConfigParamsSchema } from './schemas/prepareChainConfig';
import { prepareChainConfig } from '../prepareChainConfig';
import { setAnyTrustFastConfirmerSchema } from './schemas/setAnyTrustFastConfirmer';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../setAnyTrustFastConfirmerPrepareTransactionRequest';
import { upgradeExecutorPrepareTransactionRequestSchema } from './schemas/upgradeExecutor';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { setValidKeysetSchema } from './schemas/setValidKeyset';
import { setValidKeyset } from '../setValidKeyset';
import { setValidKeysetPrepareTransactionRequestSchema } from './schemas/setValidKeysetPrepareTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../setValidKeysetPrepareTransactionRequest';
import { createRollupFetchCoreContractsSchema } from './schemas/createRollupFetchCoreContracts';
import { createRollupFetchCoreContracts } from '../createRollupFetchCoreContracts';
import { createRollupFetchTransactionHashSchema } from './schemas/createRollupFetchTransactionHash';
import { createRollupFetchTransactionHash } from '../createRollupFetchTransactionHash';
import { fetchAllowanceSchema, fetchDecimalsSchema } from './schemas/erc20';
import { fetchAllowance, fetchDecimals } from '../utils/erc20';
import { upgradeExecutorFetchPrivilegedAccountsSchema } from './schemas/upgradeExecutor';
import { upgradeExecutorFetchPrivilegedAccounts } from '../upgradeExecutorFetchPrivilegedAccounts';
import { getBridgeUiConfigSchema } from './schemas/getBridgeUiConfig';
import { getBridgeUiConfig } from '../getBridgeUiConfig';
import { createRollupGetRetryablesFeesSchema } from './schemas/createRollupGetRetryablesFees';
import { createRollupGetRetryablesFees } from '../createRollupGetRetryablesFees';
import { createSafePrepareTransactionRequestSchema } from './schemas/createSafePrepareTransactionRequest';
import { createSafePrepareTransactionRequest } from '../createSafePrepareTransactionRequest';
import {
  createRollupEnoughCustomFeeTokenAllowanceSchema,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
} from './schemas/customFeeToken';
import { createRollupEnoughCustomFeeTokenAllowance } from '../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import {
  createRollupPrepareTransactionRequestDefaultSchema,
  createRollupPrepareTransactionRequestV21Schema,
  createRollupPrepareTransactionRequestV32Schema,
} from './schemas/createRollupPrepareTransactionRequest';
import { createRollupPrepareTransactionRequest } from '../createRollupPrepareTransactionRequest';
import {
  createRollupDefaultSchema,
  createRollupV21Schema,
  createRollupV32Schema,
} from './schemas/createRollup';
import { createRollup as createRollupFn } from '../createRollup';
import { createTokenBridgeSchema } from './schemas/createTokenBridge';
import { createTokenBridge } from '../createTokenBridge';
import { withPublicClient, withParentChainSign } from './viemTransforms';
import { createTokenBridgePrepareTransactionRequestSchema } from './schemas/createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareTransactionRequest } from '../createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequestSchema } from './schemas/createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../createTokenBridgePrepareSetWethGatewayTransactionRequest';
import {
  prepareDeploymentParamsConfigV21Schema,
  prepareDeploymentParamsConfigV32Schema,
} from './schemas/createRollupPrepareDeploymentParamsConfig';
import { createRollupPrepareDeploymentParamsConfig } from '../createRollupPrepareDeploymentParamsConfig';
import {
  feeRouterDeployRewardDistributorSchema,
  feeRouterDeployChildToParentRewardRouterSchema,
} from './schemas/feeRouter';
import { feeRouterDeployRewardDistributor } from '../feeRouterDeployRewardDistributor';
import { feeRouterDeployChildToParentRewardRouter } from '../feeRouterDeployChildToParentRewardRouter';
import { prepareNodeConfigSchema } from './schemas/prepareNodeConfig';
import { prepareNodeConfig } from '../prepareNodeConfig';
import { getDefaultsSchema } from './schemas/getDefaults';
import { getDefaultConfirmPeriodBlocks } from '../getDefaultConfirmPeriodBlocks';
import {
  schema as createRollupExampleSchema,
  execute as createRollupExecute,
} from './examples/createRollup';
import {
  schema as deployNewChainSchema,
  execute as deployNewChainExecute,
} from './examples/deployNewChain';
import {
  schema as transferOwnershipSchema,
  execute as transferOwnershipExecute,
} from './examples/transferOwnership';

describe('schema coverage', () => {
  it('getValidators', async () => {
    await assertSchemaCoverage(getValidatorsSchema, getValidators, mocks);
  });

  it('setValidKeysetPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      setValidKeysetPrepareTransactionRequestSchema,
      setValidKeysetPrepareTransactionRequest,
      mocks,
    );
  });

  it('getKeysets', async () => {
    await assertSchemaCoverage(getKeysetsSchema, getKeysets, mocks);
  });

  it('getBatchPosters', async () => {
    await assertSchemaCoverage(getBatchPostersSchema, getBatchPosters, mocks);
  });

  it('isAnyTrust', async () => {
    await assertSchemaCoverage(isAnyTrustSchema, isAnyTrust, mocks);
  });

  it('prepareKeysetHash', async () => {
    await assertSchemaCoverage(prepareKeysetHashSchema, prepareKeysetHash, mocks);
  });

  it('prepareKeyset', async () => {
    await assertSchemaCoverage(prepareKeysetSchema, prepareKeyset, mocks);
  });

  it('prepareChainConfig', async () => {
    await assertSchemaCoverage(prepareChainConfigParamsSchema, prepareChainConfig, mocks);
  });

  it('setAnyTrustFastConfirmer', async () => {
    await assertSchemaCoverage(
      setAnyTrustFastConfirmerSchema,
      setAnyTrustFastConfirmerPrepareTransactionRequest,
      mocks,
    );
  });

  it('upgradeExecutorPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      upgradeExecutorPrepareTransactionRequestSchema,
      upgradeExecutorPrepareAddExecutorTransactionRequest,
      mocks,
    );
  });

  it('setValidKeyset', async () => {
    await assertSchemaCoverage(setValidKeysetSchema, setValidKeyset, mocks);
  });

  it('createRollupFetchCoreContracts', async () => {
    await assertSchemaCoverage(
      createRollupFetchCoreContractsSchema,
      createRollupFetchCoreContracts,
      mocks,
    );
  });

  it('createRollupFetchTransactionHash', async () => {
    await assertSchemaCoverage(
      createRollupFetchTransactionHashSchema,
      createRollupFetchTransactionHash,
      mocks,
    );
  });

  it('fetchDecimals', async () => {
    await assertSchemaCoverage(fetchDecimalsSchema, fetchDecimals, mocks);
  });

  it('fetchAllowance', async () => {
    await assertSchemaCoverage(fetchAllowanceSchema, fetchAllowance, mocks);
  });

  it('upgradeExecutorFetchPrivilegedAccounts', async () => {
    await assertSchemaCoverage(
      upgradeExecutorFetchPrivilegedAccountsSchema,
      upgradeExecutorFetchPrivilegedAccounts,
      mocks,
    );
  });

  it('getBridgeUiConfig', async () => {
    await assertSchemaCoverage(getBridgeUiConfigSchema, getBridgeUiConfig, mocks);
  });

  it('createRollupGetRetryablesFees', async () => {
    await assertSchemaCoverage(
      createRollupGetRetryablesFeesSchema,
      createRollupGetRetryablesFees,
      mocks,
    );
  });

  it('createSafePrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      createSafePrepareTransactionRequestSchema,
      createSafePrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupEnoughCustomFeeTokenAllowance', async () => {
    await assertSchemaCoverage(
      createRollupEnoughCustomFeeTokenAllowanceSchema,
      createRollupEnoughCustomFeeTokenAllowance,
      mocks,
    );
  });

  it('createRollupPrepareCustomFeeTokenApprovalTransactionRequest', async () => {
    await assertSchemaCoverage(
      createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
      createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
      mocks,
    );
  });

  it('createTokenBridgeEnoughCustomFeeTokenAllowance', async () => {
    await assertSchemaCoverage(
      createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
      createTokenBridgeEnoughCustomFeeTokenAllowance,
      mocks,
    );
  });

  it('createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (default)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestDefaultSchema.transform(withPublicClient),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (v2.1)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestV21Schema.transform(withPublicClient),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (v3.2)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestV32Schema.transform(withPublicClient),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollup (default)', async () => {
    await assertSchemaCoverage(
      createRollupDefaultSchema.transform(withParentChainSign),
      createRollupFn,
      mocks,
    );
  });

  it('createRollup (v2.1)', async () => {
    await assertSchemaCoverage(
      createRollupV21Schema.transform(withParentChainSign),
      createRollupFn,
      mocks,
    );
  });

  it('createRollup (v3.2)', async () => {
    await assertSchemaCoverage(
      createRollupV32Schema.transform(withParentChainSign),
      createRollupFn,
      mocks,
    );
  });

  it('createTokenBridge', async () => {
    await assertSchemaCoverage(createTokenBridgeSchema, createTokenBridge, mocks);
  });

  it('createTokenBridgePrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareTransactionRequestSchema,
      createTokenBridgePrepareTransactionRequest,
      mocks,
    );
  });

  it('createTokenBridgePrepareSetWethGatewayTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
      createTokenBridgePrepareSetWethGatewayTransactionRequest,
      mocks,
    );
  });

  it('prepareDeploymentParamsConfigV21', async () => {
    await assertSchemaCoverage(
      prepareDeploymentParamsConfigV21Schema,
      createRollupPrepareDeploymentParamsConfig,
      mocks,
    );
  });

  it('prepareDeploymentParamsConfigV32', async () => {
    await assertSchemaCoverage(
      prepareDeploymentParamsConfigV32Schema,
      createRollupPrepareDeploymentParamsConfig,
      mocks,
    );
  });

  it('prepareNodeConfig', async () => {
    await assertSchemaCoverage(prepareNodeConfigSchema, prepareNodeConfig, mocks);
  });

  it('feeRouterDeployRewardDistributor', async () => {
    await assertSchemaCoverage(
      feeRouterDeployRewardDistributorSchema,
      feeRouterDeployRewardDistributor,
      mocks,
    );
  });

  it('feeRouterDeployChildToParentRewardRouter', async () => {
    await assertSchemaCoverage(
      feeRouterDeployChildToParentRewardRouterSchema,
      feeRouterDeployChildToParentRewardRouter,
      mocks,
    );
  });

  it('getDefaults (parentChainId variant)', async () => {
    await assertSchemaCoverage(getDefaultsSchema, getDefaultConfirmPeriodBlocks, mocks);
  });

  it('createRollup example', async () => {
    await assertSchemaCoverage(createRollupExampleSchema, createRollupExecute, mocks);
  });

  it('deployNewChain example', async () => {
    await assertSchemaCoverage(deployNewChainSchema, deployNewChainExecute, mocks, [
      {
        matches: (k) => k === 'params.keyset',
        apply: (base) => ({
          ...base,
          params: {
            ...base.params,
            config: {
              ...base.params.config,
              chainConfig: {
                chainId: 99999,
                arbitrum: {
                  InitialChainOwner: '0x' + '1'.repeat(40),
                  DataAvailabilityCommittee: true,
                },
              },
            },
          },
        }),
      },
    ]);
  });

  it('transferOwnership example', async () => {
    await assertSchemaCoverage(transferOwnershipSchema, transferOwnershipExecute, mocks, [
      {
        matches: (k) => k === 'nativeToken',
        apply: (base) => ({
          ...base,
          nativeToken: '0x0000000000000000000000000000000000000000',
        }),
      },
    ]);
  });
});
