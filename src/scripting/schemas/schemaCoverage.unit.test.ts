import { describe, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  // Inline the registry here so it's available to vi.mock factories
  // (vi.mock is hoisted above normal imports, so we can't import it)
  const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? `__bigint__${v}` : v);
  const BIGINT_METHODS = new Set(['getGasPrice', 'readContract', 'calculateRetryableSubmissionFee']);
  const HASH_METHODS = new Set(['sendRawTransaction', 'writeContract', 'signTransaction']);
  const RECEIPT_METHODS = new Set(['waitForTransactionReceipt']);
  const SIMULATE_METHODS = new Set(['simulateContract']);
  let hexCounter = 0;
  const validHex = (bytes: number) => '0x' + (++hexCounter).toString(16).padStart(bytes * 2, '0');
  const calls: unknown[] = [];

  function trackedObject(name: string): any {
    return new Proxy(Object.create(null), {
      get(_, prop) {
        if (prop === 'then') return undefined;
        if (prop === Symbol.toPrimitive) return () => validHex(20);
        if (prop === 'toJSON') return () => ({ _tracked: name });
        if (prop === 'address') return validHex(20);
        if (prop === 'chain') return { _tracked: `${name}.chain` };
        const method = String(prop);
        return (...args: unknown[]) => {
          calls.push({ target: name, method, args: JSON.parse(JSON.stringify(args, replacer)) });
          if (BIGINT_METHODS.has(method)) return Promise.resolve(1000000n);
          if (HASH_METHODS.has(method)) return Promise.resolve(validHex(32));
          if (RECEIPT_METHODS.has(method)) return Promise.resolve({ blockNumber: 1n });
          if (SIMULATE_METHODS.has(method))
            return Promise.resolve({ request: { _tracked: `${name}.${method}()` } });
          return Promise.resolve(trackedObject(`${name}.${method}()`));
        };
      },
    });
  }

  const fn = (name: string, returnValue: unknown = {}) =>
    (...args: unknown[]) => {
      calls.push({ target: name, method: 'call', args: JSON.parse(JSON.stringify(args, replacer)) });
      return Promise.resolve(returnValue);
    };

  const fnSync = (name: string, returnValue?: unknown) =>
    (...args: unknown[]) => {
      calls.push({ target: name, method: 'call', args: JSON.parse(JSON.stringify(args, replacer)) });
      return returnValue ?? validHex(32);
    };

  const clear = () => { calls.length = 0; hexCounter = 0; };
  const snapshot = () => JSON.stringify(calls, replacer);

  return { calls, trackedObject, fn, fnSync, clear, snapshot };
});

vi.mock('../viemTransforms', () => ({
  toPublicClient: (rpcUrl: string, chain: unknown) =>
    mocks.trackedObject(`PublicClient(${rpcUrl},${JSON.stringify(chain)})`),
  findChain: (chainId: number) => ({ _tracked: 'Chain', id: chainId }),
  toAccount: (pk: string) => mocks.trackedObject(`Account(${pk})`),
  toWalletClient: (rpcUrl: string, pk: string, chain: unknown) =>
    mocks.trackedObject(`WalletClient(${rpcUrl},${pk},${JSON.stringify(chain)})`),
}));

// Prevent runScript from firing when importing example scripts.
// Examples call runScript at module level, which reads process.argv and exits.
vi.mock('../scriptUtils', () => ({ runScript: () => {} }));

// Functions called inside schema transforms (not side effects, just
// deterministic transforms that need to work during parse).
vi.mock('../../createRollupPrepareDeploymentParamsConfig', () => ({
  createRollupPrepareDeploymentParamsConfig: mocks.fnSync('createRollupPrepareDeploymentParamsConfig', {
    _mock: 'deploymentParamsConfig',
  }),
}));
vi.mock('../../prepareChainConfig', () => ({
  prepareChainConfig: mocks.fnSync('prepareChainConfig', { _mock: 'chainConfig' }),
}));

// SDK functions -- each records into mocks so assertSchemaCoverage can
// detect whether field mutations change what they receive.
vi.mock('../../getValidators', () => ({
  getValidators: mocks.fn('getValidators'),
}));
vi.mock('../../setValidKeysetPrepareTransactionRequest', () => ({
  setValidKeysetPrepareTransactionRequest: mocks.fn('setValidKeysetPrepareTransactionRequest'),
}));
vi.mock('../../getKeysets', () => ({ getKeysets: mocks.fn('getKeysets') }));
vi.mock('../../getBatchPosters', () => ({ getBatchPosters: mocks.fn('getBatchPosters') }));
vi.mock('../../isAnyTrust', () => ({ isAnyTrust: mocks.fn('isAnyTrust') }));
vi.mock('../../prepareKeysetHash', () => ({ prepareKeysetHash: mocks.fn('prepareKeysetHash') }));
vi.mock('../../prepareKeyset', () => ({ prepareKeyset: mocks.fn('prepareKeyset') }));
vi.mock('../../setAnyTrustFastConfirmerPrepareTransactionRequest', () => ({
  setAnyTrustFastConfirmerPrepareTransactionRequest: mocks.fn('setAnyTrustFastConfirmer'),
}));
vi.mock('../../createRollupFetchCoreContracts', () => ({
  createRollupFetchCoreContracts: mocks.fn('createRollupFetchCoreContracts'),
}));
vi.mock('../../createRollupFetchTransactionHash', () => ({
  createRollupFetchTransactionHash: mocks.fn('createRollupFetchTransactionHash'),
}));
vi.mock('../../utils/erc20', () => ({
  fetchAllowance: mocks.fn('fetchAllowance'),
  fetchDecimals: mocks.fn('fetchDecimals'),
}));
vi.mock('../../upgradeExecutorFetchPrivilegedAccounts', () => ({
  upgradeExecutorFetchPrivilegedAccounts: mocks.fn('upgradeExecutorFetchPrivilegedAccounts'),
}));
vi.mock('../../getBridgeUiConfig', () => ({
  getBridgeUiConfig: mocks.fn('getBridgeUiConfig'),
}));
vi.mock('../../isTokenBridgeDeployed', () => ({
  isTokenBridgeDeployed: mocks.fn('isTokenBridgeDeployed'),
}));
vi.mock('../../createRollupGetRetryablesFees', () => ({
  createRollupGetRetryablesFees: mocks.fn('createRollupGetRetryablesFees'),
}));
vi.mock('../../createSafePrepareTransactionRequest', () => ({
  createSafePrepareTransactionRequest: mocks.fn('createSafePrepareTransactionRequest'),
}));
vi.mock('../../createRollupEnoughCustomFeeTokenAllowance', () => ({
  createRollupEnoughCustomFeeTokenAllowance: mocks.fn('createRollupEnoughCustomFeeTokenAllowance'),
}));
vi.mock('../../createRollupPrepareCustomFeeTokenApprovalTransactionRequest', () => ({
  createRollupPrepareCustomFeeTokenApprovalTransactionRequest: mocks.fn('createRollupPrepareCustomFeeTokenApproval'),
}));
vi.mock('../../createTokenBridgeEnoughCustomFeeTokenAllowance', () => ({
  createTokenBridgeEnoughCustomFeeTokenAllowance: mocks.fn('createTokenBridgeEnoughCustomFeeTokenAllowance'),
}));
vi.mock('../../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest', () => ({
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest: mocks.fn('createTokenBridgePrepareCustomFeeTokenApproval'),
}));
vi.mock('../../createRollupPrepareTransactionRequest', () => ({
  createRollupPrepareTransactionRequest: mocks.fn('createRollupPrepareTransactionRequest'),
}));
vi.mock('../../createTokenBridge', () => ({
  createTokenBridge: mocks.fn('createTokenBridge'),
}));
vi.mock('../../createTokenBridgePrepareTransactionRequest', () => ({
  createTokenBridgePrepareTransactionRequest: mocks.fn('createTokenBridgePrepareTransactionRequest'),
}));
vi.mock('../../createTokenBridgePrepareSetWethGatewayTransactionRequest', () => ({
  createTokenBridgePrepareSetWethGatewayTransactionRequest: mocks.fn('createTokenBridgePrepareSetWethGateway'),
}));
vi.mock('../../feeRouterDeployRewardDistributor', () => ({
  feeRouterDeployRewardDistributor: mocks.fn('feeRouterDeployRewardDistributor'),
}));
vi.mock('../../feeRouterDeployChildToParentRewardRouter', () => ({
  feeRouterDeployChildToParentRewardRouter: mocks.fn('feeRouterDeployChildToParentRewardRouter'),
}));
vi.mock('../../prepareNodeConfig', () => ({
  prepareNodeConfig: mocks.fn('prepareNodeConfig'),
}));
vi.mock('../../getDefaultConfirmPeriodBlocks', () => ({
  getDefaultConfirmPeriodBlocks: mocks.fn('getDefaultConfirmPeriodBlocks'),
}));
vi.mock('../../createRollup', () => ({
  createRollup: mocks.fn('createRollup', { coreContracts: {} }),
}));
vi.mock('../../setValidKeyset', () => ({
  setValidKeyset: mocks.fn('setValidKeyset'),
}));
vi.mock('../../utils/generateChainId', () => ({
  generateChainId: () => 999999,
}));
vi.mock('../../upgradeExecutorPrepareAddExecutorTransactionRequest', () => ({
  upgradeExecutorPrepareAddExecutorTransactionRequest: mocks.fn('addExecutor'),
}));
vi.mock('../../upgradeExecutorPrepareRemoveExecutorTransactionRequest', () => ({
  upgradeExecutorPrepareRemoveExecutorTransactionRequest: mocks.fn('removeExecutor'),
}));
vi.mock('../../upgradeExecutorEncodeFunctionData', () => ({
  UPGRADE_EXECUTOR_ROLE_EXECUTOR: '0x' + 'ab'.repeat(32),
  upgradeExecutorEncodeFunctionData: mocks.fnSync('upgradeExecutorEncodeFunctionData'),
}));
vi.mock('viem', async (importOriginal) => {
  const original = await importOriginal<typeof import('viem')>();
  return {
    ...original,
    encodeFunctionData: mocks.fnSync('encodeFunctionData'),
    createWalletClient: (opts: any) =>
      mocks.trackedObject(`childWalletClient(${JSON.stringify(opts?.chain?.id ?? opts)})`),
    custom: () => ({}),
    defineChain: (def: any) => def,
  };
});

import { getValidatorsSchema, getValidatorsTransform } from './getValidators';
import { getValidators } from '../../getValidators';
import { getKeysetsSchema, getKeysetsTransform } from './getKeysets';
import { getKeysets } from '../../getKeysets';
import { getBatchPostersSchema, getBatchPostersTransform } from './getBatchPosters';
import { getBatchPosters } from '../../getBatchPosters';
import { isAnyTrustSchema, isAnyTrustTransform } from './isAnyTrust';
import { isAnyTrust } from '../../isAnyTrust';
import { prepareKeysetHashSchema, prepareKeysetHashTransform } from './prepareKeysetHash';
import { prepareKeysetHash } from '../../prepareKeysetHash';
import { prepareKeysetSchema, prepareKeysetTransform } from './prepareKeyset';
import { prepareKeyset } from '../../prepareKeyset';
import { prepareChainConfigParamsSchema, prepareChainConfigTransform } from './prepareChainConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { setAnyTrustFastConfirmerSchema, setAnyTrustFastConfirmerTransform } from './setAnyTrustFastConfirmer';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';
import {
  upgradeExecutorPrepareTransactionRequestSchema,
  upgradeExecutorPrepareTransactionRequestTransform,
} from './upgradeExecutor';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from '../../upgradeExecutorPrepareAddExecutorTransactionRequest';
import { setValidKeysetSchema, setValidKeysetTransform } from './setValidKeyset';
import { setValidKeyset } from '../../setValidKeyset';
import {
  setValidKeysetPrepareTransactionRequestSchema,
  setValidKeysetPrepareTransactionRequestTransform,
} from './setValidKeysetPrepareTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../../setValidKeysetPrepareTransactionRequest';
import {
  createRollupFetchCoreContractsSchema,
  createRollupFetchCoreContractsTransform,
} from './createRollupFetchCoreContracts';
import { createRollupFetchCoreContracts } from '../../createRollupFetchCoreContracts';
import {
  createRollupFetchTransactionHashSchema,
  createRollupFetchTransactionHashTransform,
} from './createRollupFetchTransactionHash';
import { createRollupFetchTransactionHash } from '../../createRollupFetchTransactionHash';
import { fetchAllowanceSchema, fetchAllowanceTransform, fetchDecimalsSchema, fetchDecimalsTransform } from './erc20';
import { fetchAllowance, fetchDecimals } from '../../utils/erc20';
import {
  upgradeExecutorFetchPrivilegedAccountsSchema,
  upgradeExecutorFetchPrivilegedAccountsTransform,
} from './upgradeExecutor';
import { upgradeExecutorFetchPrivilegedAccounts } from '../../upgradeExecutorFetchPrivilegedAccounts';
import { getBridgeUiConfigSchema, getBridgeUiConfigTransform } from './getBridgeUiConfig';
import { getBridgeUiConfig } from '../../getBridgeUiConfig';
import { isTokenBridgeDeployedSchema, isTokenBridgeDeployedTransform } from './isTokenBridgeDeployed';
import { isTokenBridgeDeployed } from '../../isTokenBridgeDeployed';
import { createRollupGetRetryablesFeesSchema, createRollupGetRetryablesFeesTransform } from './createRollupGetRetryablesFees';
import { createRollupGetRetryablesFees } from '../../createRollupGetRetryablesFees';
import { createSafePrepareTransactionRequestSchema, createSafePrepareTransactionRequestTransform } from './createSafePrepareTransactionRequest';
import { createSafePrepareTransactionRequest } from '../../createSafePrepareTransactionRequest';
import {
  createRollupEnoughCustomFeeTokenAllowanceSchema,
  createRollupEnoughCustomFeeTokenAllowanceTransform,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform,
  createTokenBridgeEnoughCustomFeeTokenAllowanceSchema,
  createTokenBridgeEnoughCustomFeeTokenAllowanceTransform,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema,
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform,
} from './customFeeToken';
import { createRollupEnoughCustomFeeTokenAllowance } from '../../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';
import {
  createRollupPrepareTransactionRequestDefaultSchema,
  createRollupPrepareTransactionRequestTransform,
} from './createRollupPrepareTransactionRequest';
import { createRollupPrepareTransactionRequest } from '../../createRollupPrepareTransactionRequest';
import { createRollupSchema, createRollupTransform } from './createRollup';
import { createRollup as createRollupFn } from '../../createRollup';
import { createTokenBridgeSchema, createTokenBridgeTransform } from './createTokenBridge';
import { createTokenBridge } from '../../createTokenBridge';
import {
  createTokenBridgePrepareTransactionRequestSchema,
  createTokenBridgePrepareTransactionRequestTransform,
} from './createTokenBridgePrepareTransactionRequest';
import { createTokenBridgePrepareTransactionRequest } from '../../createTokenBridgePrepareTransactionRequest';
import {
  createTokenBridgePrepareSetWethGatewayTransactionRequestSchema,
  createTokenBridgePrepareSetWethGatewayTransactionRequestTransform,
} from './createTokenBridgePrepareSetWethGatewayTransactionRequest';
import { createTokenBridgePrepareSetWethGatewayTransactionRequest } from '../../createTokenBridgePrepareSetWethGatewayTransactionRequest';
import {
  prepareDeploymentParamsConfigV21Schema,
  prepareDeploymentParamsConfigV21Transform,
  prepareDeploymentParamsConfigV32Schema,
  prepareDeploymentParamsConfigV32Transform,
} from './createRollupPrepareDeploymentParamsConfig';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import {
  feeRouterDeployRewardDistributorSchema,
  feeRouterDeployRewardDistributorTransform,
  feeRouterDeployChildToParentRewardRouterSchema,
  feeRouterDeployChildToParentRewardRouterTransform,
} from './feeRouter';
import { feeRouterDeployRewardDistributor } from '../../feeRouterDeployRewardDistributor';
import { feeRouterDeployChildToParentRewardRouter } from '../../feeRouterDeployChildToParentRewardRouter';
import { prepareNodeConfigSchema, prepareNodeConfigTransform } from './prepareNodeConfig';
import { prepareNodeConfig } from '../../prepareNodeConfig';
import { getDefaultsSchema, getDefaultsTransform } from './getDefaults';
import { getDefaultConfirmPeriodBlocks } from '../../getDefaultConfirmPeriodBlocks';
import { assertSchemaCoverage } from './schemaCoverage';
import {
  schema as createRollupExampleSchema,
  execute as createRollupExecute,
} from '../examples/createRollup';
import {
  schema as deployNewChainSchema,
  execute as deployNewChainExecute,
} from '../examples/deployNewChain';
import {
  schema as transferOwnershipSchema,
  execute as transferOwnershipExecute,
} from '../examples/transferOwnership';

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
        setValidKeysetPrepareTransactionRequestTransform,
      ),
      setValidKeysetPrepareTransactionRequest,
      mocks,
    );
  });

  it('getKeysets', async () => {
    await assertSchemaCoverage(
      getKeysetsSchema.transform(getKeysetsTransform),
      getKeysets,
      mocks,
    );
  });

  it('getBatchPosters', async () => {
    await assertSchemaCoverage(
      getBatchPostersSchema.transform(getBatchPostersTransform),
      getBatchPosters,
      mocks,
    );
  });

  it('isAnyTrust', async () => {
    await assertSchemaCoverage(
      isAnyTrustSchema.transform(isAnyTrustTransform),
      isAnyTrust,
      mocks,
    );
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
      setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerTransform),
      setAnyTrustFastConfirmerPrepareTransactionRequest,
      mocks,
    );
  });

  it('upgradeExecutorPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      upgradeExecutorPrepareTransactionRequestSchema.transform(
        upgradeExecutorPrepareTransactionRequestTransform,
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
      createRollupFetchCoreContractsSchema.transform(createRollupFetchCoreContractsTransform),
      createRollupFetchCoreContracts,
      mocks,
    );
  });

  it('createRollupFetchTransactionHash', async () => {
    await assertSchemaCoverage(
      createRollupFetchTransactionHashSchema.transform(createRollupFetchTransactionHashTransform),
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
        createSafePrepareTransactionRequestTransform,
      ),
      createSafePrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollupEnoughCustomFeeTokenAllowance', async () => {
    await assertSchemaCoverage(
      createRollupEnoughCustomFeeTokenAllowanceSchema.transform(
        createRollupEnoughCustomFeeTokenAllowanceTransform,
      ),
      createRollupEnoughCustomFeeTokenAllowance,
      mocks,
    );
  });

  it('createRollupPrepareCustomFeeTokenApprovalTransactionRequest', async () => {
    await assertSchemaCoverage(
      createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(
        createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform,
      ),
      createRollupPrepareCustomFeeTokenApprovalTransactionRequest,
      mocks,
    );
  });

  it('createTokenBridgeEnoughCustomFeeTokenAllowance', async () => {
    await assertSchemaCoverage(
      createTokenBridgeEnoughCustomFeeTokenAllowanceSchema.transform(
        createTokenBridgeEnoughCustomFeeTokenAllowanceTransform,
      ),
      createTokenBridgeEnoughCustomFeeTokenAllowance,
      mocks,
    );
  });

  it('createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema.transform(
        createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform,
      ),
      createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest,
      mocks,
    );
  });

  it('createRollupPrepareTransactionRequest (default)', async () => {
    await assertSchemaCoverage(
      createRollupPrepareTransactionRequestDefaultSchema.transform(
        createRollupPrepareTransactionRequestTransform,
      ),
      createRollupPrepareTransactionRequest,
      mocks,
    );
  });

  it('createRollup (default)', async () => {
    await assertSchemaCoverage(
      createRollupSchema.transform(createRollupTransform),
      createRollupFn,
      mocks,
    );
  });

  it('createTokenBridge', async () => {
    await assertSchemaCoverage(
      createTokenBridgeSchema.transform(createTokenBridgeTransform),
      createTokenBridge,
      mocks,
    );
  });

  it('createTokenBridgePrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareTransactionRequestSchema.transform(
        createTokenBridgePrepareTransactionRequestTransform,
      ),
      createTokenBridgePrepareTransactionRequest,
      mocks,
    );
  });

  it('createTokenBridgePrepareSetWethGatewayTransactionRequest', async () => {
    await assertSchemaCoverage(
      createTokenBridgePrepareSetWethGatewayTransactionRequestSchema.transform(
        createTokenBridgePrepareSetWethGatewayTransactionRequestTransform,
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
      feeRouterDeployRewardDistributorSchema.transform(feeRouterDeployRewardDistributorTransform),
      feeRouterDeployRewardDistributor,
      mocks,
    );
  });

  it('feeRouterDeployChildToParentRewardRouter', async () => {
    await assertSchemaCoverage(
      feeRouterDeployChildToParentRewardRouterSchema.transform(
        feeRouterDeployChildToParentRewardRouterTransform,
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
      // keyset only matters when DataAvailabilityCommittee is true (enforced
      // by superRefine). Override sets AnyTrust context so keyset is testable.
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
      // nativeToken controls a conditional branch (ERC20 vs ETH). Both
      // generated values are non-zero, so we need one run with zeroAddress
      // to exercise the branch difference.
      nativeToken: (base) => ({
        ...base,
        nativeToken: '0x0000000000000000000000000000000000000000',
      }),
    });
  });
});
