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
  createRollupPrepareDeploymentParamsConfig: (_client: unknown, params: unknown) => ({
    _mock: 'deploymentParamsConfig',
    params,
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
