import { describe, it } from 'vitest';
import { mocks, assertSchemaCoverage } from './schemaCoverage';

import { getValidatorsSchema, getValidatorsTransform } from './schemas/getValidators';
import { getValidators } from '../getValidators';
import { getKeysetsSchema, getKeysetsTransform } from './schemas/getKeysets';
import { getKeysets } from '../getKeysets';
import { getBatchPostersSchema, getBatchPostersTransform } from './schemas/getBatchPosters';
import { getBatchPosters } from '../getBatchPosters';
import { isAnyTrustSchema, isAnyTrustResolver } from './schemas/isAnyTrust';
import { isAnyTrust } from '../isAnyTrust';
import { prepareKeysetHashSchema, prepareKeysetHashTransform } from './schemas/prepareKeysetHash';
import { prepareKeysetHash } from '../prepareKeysetHash';
import { prepareKeysetSchema, prepareKeysetTransform } from './schemas/prepareKeyset';
import { prepareKeyset } from '../prepareKeyset';
import {
  prepareChainConfigParamsSchema,
  prepareChainConfigTransform,
} from './schemas/prepareChainConfig';
import { prepareChainConfig } from '../prepareChainConfig';
import {
  setAnyTrustFastConfirmerSchema,
  setAnyTrustFastConfirmerResolver,
} from './schemas/setAnyTrustFastConfirmer';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../setAnyTrustFastConfirmerPrepareTransactionRequest';
import {
  upgradeExecutorPrepareTransactionRequestSchema,
  upgradeExecutorPrepareTransactionRequestResolver,
} from './schemas/upgradeExecutor';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { setValidKeysetSchema, setValidKeysetTransform } from './schemas/setValidKeyset';
import { setValidKeyset } from '../setValidKeyset';
import {
  setValidKeysetPrepareTransactionRequestSchema,
  setValidKeysetPrepareTransactionRequestResolver,
} from './schemas/setValidKeysetPrepareTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../setValidKeysetPrepareTransactionRequest';
import {
  createRollupFetchCoreContractsSchema,
  createRollupFetchCoreContractsResolver,
} from './schemas/createRollupFetchCoreContracts';
import { createRollupFetchCoreContracts } from '../createRollupFetchCoreContracts';
import {
  createRollupFetchTransactionHashSchema,
  createRollupFetchTransactionHashResolver,
} from './schemas/createRollupFetchTransactionHash';
import { createRollupFetchTransactionHash } from '../createRollupFetchTransactionHash';
import {
  fetchAllowanceSchema,
  fetchAllowanceTransform,
  fetchDecimalsSchema,
  fetchDecimalsTransform,
} from './schemas/erc20';
import { fetchAllowance, fetchDecimals } from '../utils/erc20';
import {
  upgradeExecutorFetchPrivilegedAccountsSchema,
  upgradeExecutorFetchPrivilegedAccountsTransform,
} from './schemas/upgradeExecutor';
import { upgradeExecutorFetchPrivilegedAccounts } from '../upgradeExecutorFetchPrivilegedAccounts';
import { getBridgeUiConfigSchema, getBridgeUiConfigTransform } from './schemas/getBridgeUiConfig';
import { getBridgeUiConfig } from '../getBridgeUiConfig';
import {
  isTokenBridgeDeployedSchema,
  isTokenBridgeDeployedTransform,
} from './schemas/isTokenBridgeDeployed';
import { isTokenBridgeDeployed } from '../isTokenBridgeDeployed';
import {
  createRollupGetRetryablesFeesSchema,
  createRollupGetRetryablesFeesTransform,
} from './schemas/createRollupGetRetryablesFees';
import { createRollupGetRetryablesFees } from '../createRollupGetRetryablesFees';
import {
  createSafePrepareTransactionRequestSchema,
  createSafePrepareTransactionRequestResolver,
} from './schemas/createSafePrepareTransactionRequest';
import { createSafePrepareTransactionRequest } from '../createSafePrepareTransactionRequest';
import {
  createRollupEnoughCustomFeeTokenAllowanceSchema,
  createRollupEnoughCustomFeeTokenAllowanceResolver,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestResolver,
  createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
  createTokenBridgeEnoughCustomFeeTokenAllowanceResolver,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestResolver,
} from './schemas/customFeeToken';
import { createRollupEnoughCustomFeeTokenAllowance } from '../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import {
  createRollupPrepareTransactionRequestDefaultSchema,
  createRollupPrepareTransactionRequestV21Schema,
  createRollupPrepareTransactionRequestV32Schema,
  createRollupPrepareTransactionRequestResolver,
} from './schemas/createRollupPrepareTransactionRequest';
import { createRollupPrepareTransactionRequest } from '../createRollupPrepareTransactionRequest';
import {
  createRollupDefaultSchema,
  createRollupV21Schema,
  createRollupV32Schema,
  createRollupResolver,
} from './schemas/createRollup';
import { createRollup as createRollupFn } from '../createRollup';
import { createTokenBridgeSchema, createTokenBridgeResolver } from './schemas/createTokenBridge';
import { createTokenBridge } from '../createTokenBridge';
import {
  createTokenBridgePrepareTransactionRequestSchema,
  createTokenBridgePrepareTransactionRequestResolver,
} from './schemas/createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareTransactionRequest } from '../createTokenBridgePrepareTransactionRequest';
import {
  createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
  createTokenBridgePrepareSetWethGatewayTransactionRequestResolver,
} from './schemas/createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../createTokenBridgePrepareSetWethGatewayTransactionRequest';
import {
  prepareDeploymentParamsConfigV21Schema,
  prepareDeploymentParamsConfigV21Transform,
  prepareDeploymentParamsConfigV32Schema,
  prepareDeploymentParamsConfigV32Transform,
} from './schemas/createRollupPrepareDeploymentParamsConfig';
import { createRollupPrepareDeploymentParamsConfig } from '../createRollupPrepareDeploymentParamsConfig';
import {
  feeRouterDeployRewardDistributorSchema,
  feeRouterDeployRewardDistributorResolver,
  feeRouterDeployChildToParentRewardRouterSchema,
  feeRouterDeployChildToParentRewardRouterResolver,
} from './schemas/feeRouter';
import { feeRouterDeployRewardDistributor } from '../feeRouterDeployRewardDistributor';
import { feeRouterDeployChildToParentRewardRouter } from '../feeRouterDeployChildToParentRewardRouter';
import { prepareNodeConfigSchema, prepareNodeConfigTransform } from './schemas/prepareNodeConfig';
import { prepareNodeConfig } from '../prepareNodeConfig';
import { getDefaultsSchema, getDefaultsTransform } from './schemas/getDefaults';
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
    await assertSchemaCoverage(
      getValidatorsSchema.transform(getValidatorsTransform),
      getValidators,
      mocks,
    );
  });

  it('setValidKeysetPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      setValidKeysetPrepareTransactionRequestSchema.transform(
        setValidKeysetPrepareTransactionRequestResolver,
      ),
      setValidKeysetPrepareTransactionRequest,
      mocks,
    );
  });

  it('getKeysets', async () => {
    await assertSchemaCoverage(getKeysetsSchema.transform(getKeysetsTransform), getKeysets, mocks);
  });

  it('getBatchPosters', async () => {
    await assertSchemaCoverage(
      getBatchPostersSchema.transform(getBatchPostersTransform),
      getBatchPosters,
      mocks,
    );
  });

  it('isAnyTrust', async () => {
    await assertSchemaCoverage(isAnyTrustSchema.transform(isAnyTrustResolver), isAnyTrust, mocks);
  });

  it('prepareKeysetHash', async () => {
    await assertSchemaCoverage(
      prepareKeysetHashSchema.transform(prepareKeysetHashTransform),
      prepareKeysetHash,
      mocks,
    );
  });

  it('prepareKeyset', async () => {
    await assertSchemaCoverage(
      prepareKeysetSchema.transform(prepareKeysetTransform),
      prepareKeyset,
      mocks,
    );
  });

  it('prepareChainConfig', async () => {
    await assertSchemaCoverage(
      prepareChainConfigParamsSchema.transform(prepareChainConfigTransform),
      prepareChainConfig,
      mocks,
    );
  });

  it('setAnyTrustFastConfirmer', async () => {
    await assertSchemaCoverage(
      setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerResolver),
      setAnyTrustFastConfirmerPrepareTransactionRequest,
      mocks,
    );
  });

  it('upgradeExecutorPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      upgradeExecutorPrepareTransactionRequestSchema.transform(
        upgradeExecutorPrepareTransactionRequestResolver,
      ),
      upgradeExecutorPrepareAddExecutorTransactionRequest,
      mocks,
    );
  });

  it('setValidKeyset', async () => {
    await assertSchemaCoverage(
      setValidKeysetSchema.transform(setValidKeysetTransform),
      setValidKeyset,
      mocks,
    );
  });

  it('createRollupFetchCoreContracts', async () => {
    await assertSchemaCoverage(
      createRollupFetchCoreContractsSchema.transform(createRollupFetchCoreContractsResolver),
      createRollupFetchCoreContracts,
      mocks,
    );
  });

  it('createRollupFetchTransactionHash', async () => {
    await assertSchemaCoverage(
      createRollupFetchTransactionHashSchema.transform(createRollupFetchTransactionHashResolver),
      createRollupFetchTransactionHash,
      mocks,
    );
  });

  it('fetchDecimals', async () => {
    await assertSchemaCoverage(
      fetchDecimalsSchema.transform(fetchDecimalsTransform),
      fetchDecimals,
      mocks,
    );
  });

  it('fetchAllowance', async () => {
    await assertSchemaCoverage(
      fetchAllowanceSchema.transform(fetchAllowanceTransform),
      fetchAllowance,
      mocks,
    );
  });

  it('upgradeExecutorFetchPrivilegedAccounts', async () => {
    await assertSchemaCoverage(
      upgradeExecutorFetchPrivilegedAccountsSchema.transform(
        upgradeExecutorFetchPrivilegedAccountsTransform,
      ),
      upgradeExecutorFetchPrivilegedAccounts,
      mocks,
    );
  });

  it('getBridgeUiConfig', async () => {
    await assertSchemaCoverage(
      getBridgeUiConfigSchema.transform(getBridgeUiConfigTransform),
      getBridgeUiConfig,
      mocks,
    );
  });

  it('isTokenBridgeDeployed', async () => {
    await assertSchemaCoverage(
      isTokenBridgeDeployedSchema.transform(isTokenBridgeDeployedTransform),
      isTokenBridgeDeployed,
      mocks,
    );
  });

  it('createRollupGetRetryablesFees', async () => {
    await assertSchemaCoverage(
      createRollupGetRetryablesFeesSchema.transform(createRollupGetRetryablesFeesTransform),
      createRollupGetRetryablesFees,
      mocks,
    );
  });

  it('createSafePrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      createSafePrepareTransactionRequestSchema.transform(
        createSafePrepareTransactionRequestResolver,
      ),
      createSafePrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupEnoughCustomFeeTokenAllowance', async () => {
    await assertSchemaCoverage(
      createRollupEnoughCustomFeeTokenAllowanceSchema.transform(
        createRollupEnoughCustomFeeTokenAllowanceResolver,
      ),
      createRollupEnoughCustomFeeTokenAllowance,
      mocks,
    );
  });

  it('createRollupPrepareCustomFeeTokenApprovalTransactionRequest', async () => {
    await assertSchemaCoverage(
      createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(
        createRollupPrepareCustomFeeTokenApprovalTransactionRequestResolver,
      ),
      createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
      mocks,
    );
  });

  it('createTokenBridgeEnoughCustomFeeTokenAllowance', async () => {
    await assertSchemaCoverage(
      createTokenBridgeEnoughCustomFeeTokenAllowanceSchema.transform(
        createTokenBridgeEnoughCustomFeeTokenAllowanceResolver,
      ),
      createTokenBridgeEnoughCustomFeeTokenAllowance,
      mocks,
    );
  });

  it('createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(
        createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestResolver,
      ),
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (default)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestDefaultSchema.transform(
        createRollupPrepareTransactionRequestResolver,
      ),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (v2.1)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestV21Schema.transform(
        createRollupPrepareTransactionRequestResolver,
      ),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (v3.2)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestV32Schema.transform(
        createRollupPrepareTransactionRequestResolver,
      ),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollup (default)', async () => {
    await assertSchemaCoverage(
      createRollupDefaultSchema.transform(createRollupResolver),
      createRollupFn,
      mocks,
    );
  });

  it('createRollup (v2.1)', async () => {
    await assertSchemaCoverage(
      createRollupV21Schema.transform(createRollupResolver),
      createRollupFn,
      mocks,
    );
  });

  it('createRollup (v3.2)', async () => {
    await assertSchemaCoverage(
      createRollupV32Schema.transform(createRollupResolver),
      createRollupFn,
      mocks,
    );
  });

  it('createTokenBridge', async () => {
    await assertSchemaCoverage(
      createTokenBridgeSchema.transform(createTokenBridgeResolver),
      createTokenBridge,
      mocks,
    );
  });

  it('createTokenBridgePrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareTransactionRequestSchema.transform(
        createTokenBridgePrepareTransactionRequestResolver,
      ),
      createTokenBridgePrepareTransactionRequest,
      mocks,
    );
  });

  it('createTokenBridgePrepareSetWethGatewayTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareSetWethGatewayTransactionRequestSchema.transform(
        createTokenBridgePrepareSetWethGatewayTransactionRequestResolver,
      ),
      createTokenBridgePrepareSetWethGatewayTransactionRequest,
      mocks,
    );
  });

  it('prepareDeploymentParamsConfigV21', async () => {
    await assertSchemaCoverage(
      prepareDeploymentParamsConfigV21Schema.transform(prepareDeploymentParamsConfigV21Transform),
      createRollupPrepareDeploymentParamsConfig,
      mocks,
    );
  });

  it('prepareDeploymentParamsConfigV32', async () => {
    await assertSchemaCoverage(
      prepareDeploymentParamsConfigV32Schema.transform(prepareDeploymentParamsConfigV32Transform),
      createRollupPrepareDeploymentParamsConfig,
      mocks,
    );
  });

  it('prepareNodeConfig', async () => {
    await assertSchemaCoverage(
      prepareNodeConfigSchema.transform(prepareNodeConfigTransform),
      prepareNodeConfig,
      mocks,
    );
  });

  it('feeRouterDeployRewardDistributor', async () => {
    await assertSchemaCoverage(
      feeRouterDeployRewardDistributorSchema.transform(feeRouterDeployRewardDistributorResolver),
      feeRouterDeployRewardDistributor,
      mocks,
    );
  });

  it('feeRouterDeployChildToParentRewardRouter', async () => {
    await assertSchemaCoverage(
      feeRouterDeployChildToParentRewardRouterSchema.transform(
        feeRouterDeployChildToParentRewardRouterResolver,
      ),
      feeRouterDeployChildToParentRewardRouter,
      mocks,
    );
  });

  it('getDefaults (parentChainId variant)', async () => {
    await assertSchemaCoverage(
      getDefaultsSchema.transform(getDefaultsTransform),
      getDefaultConfirmPeriodBlocks,
      mocks,
    );
  });

  it('createRollup example', async () => {
    await assertSchemaCoverage(createRollupExampleSchema, createRollupExecute, mocks);
  });

  it('deployNewChain example', async () => {
    await assertSchemaCoverage(deployNewChainSchema, deployNewChainExecute, mocks, {
      'params.keyset': (base) => ({
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
    });
  });

  it('transferOwnership example', async () => {
    await assertSchemaCoverage(transferOwnershipSchema, transferOwnershipExecute, mocks, {
      nativeToken: (base) => ({
        ...base,
        nativeToken: '0x0000000000000000000000000000000000000000',
      }),
    });
  });
});
