import { describe, it, vi } from 'vitest';

const { sideEffects, createTrackedObject } = await vi.hoisted(
  () => import('./testTracker'),
);

vi.mock('../viemTransforms', () => ({
  toPublicClient: (rpcUrl: string, chain: unknown) =>
    createTrackedObject(`PublicClient(${rpcUrl},${JSON.stringify(chain)})`),
  findChain: (chainId: number) => ({ _tracked: 'Chain', id: chainId }),
  toAccount: (pk: string) => createTrackedObject(`Account(${pk})`),
  toWalletClient: (rpcUrl: string, pk: string, chain: unknown) =>
    createTrackedObject(`WalletClient(${rpcUrl},${pk},${JSON.stringify(chain)})`),
}));

import { getValidatorsSchema, getValidatorsTransform } from './getValidators';
import { getValidators } from '../../getValidators';
import {
  setValidKeysetPrepareTransactionRequestSchema,
  setValidKeysetPrepareTransactionRequestTransform,
} from './setValidKeysetPrepareTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../../setValidKeysetPrepareTransactionRequest';
import { assertSchemaCoverage } from './schemaCoverage';

// Prevent runScript from firing when importing example scripts.
// Examples call runScript at module level, which reads process.argv and exits.
vi.mock('../scriptUtils', () => ({ runScript: () => {} }));

// The createRollup example's schema transform calls these SDK functions.
// Mock them to return deterministic values based on their inputs.
vi.mock('../../createRollupPrepareDeploymentParamsConfig', () => ({
  createRollupPrepareDeploymentParamsConfig: (_client: unknown, params: unknown) => ({
    _mock: 'deploymentParamsConfig',
    params,
  }),
}));
vi.mock('../../prepareChainConfig', () => ({
  prepareChainConfig: (params: unknown) => ({ _mock: 'chainConfig', params }),
}));

// Mock SDK functions called by example scripts. Each records into
// sideEffects so assertSchemaCoverage can detect changes.
vi.mock('../../createRollup', () => ({
  createRollup: (...args: unknown[]) => {
    sideEffects.push({ target: 'createRollup', args });
    return Promise.resolve({ coreContracts: {} });
  },
}));
vi.mock('../../upgradeExecutorPrepareAddExecutorTransactionRequest', () => ({
  upgradeExecutorPrepareAddExecutorTransactionRequest: (...args: unknown[]) => {
    sideEffects.push({ target: 'upgradeExecutorPrepareAddExecutorTransactionRequest', args });
    return Promise.resolve({ _mock: 'addExecutorTxRequest' });
  },
}));
vi.mock('../../upgradeExecutorPrepareRemoveExecutorTransactionRequest', () => ({
  upgradeExecutorPrepareRemoveExecutorTransactionRequest: (...args: unknown[]) => {
    sideEffects.push({ target: 'upgradeExecutorPrepareRemoveExecutorTransactionRequest', args });
    return Promise.resolve({ _mock: 'removeExecutorTxRequest' });
  },
}));
// transferOwnership uses viem functions for encoding and signing.
// Mock them to record calls and return deterministic values.
// transferOwnership uses viem functions for encoding and signing.
// Mocks preserve input identity so field mutations are visible in sideEffects.
vi.mock('viem', async (importOriginal) => {
  const original = await importOriginal<typeof import('viem')>();
  return {
    ...original,
    encodeFunctionData: (...args: unknown[]) => {
      sideEffects.push({ target: 'encodeFunctionData', args });
      const bigintReplacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? `${v}` : v);
      return `0xencode_${JSON.stringify(args, bigintReplacer).slice(0, 40)}`;
    },
    createWalletClient: (opts: any) =>
      createTrackedObject(`childWalletClient(${JSON.stringify(opts?.chain?.id ?? opts)})`),
    custom: () => ({}),
    defineChain: (def: any) => def,
  };
});
vi.mock('../../upgradeExecutorEncodeFunctionData', () => ({
  UPGRADE_EXECUTOR_ROLE_EXECUTOR: '0x' + 'ab'.repeat(32),
  upgradeExecutorEncodeFunctionData: (...args: unknown[]) => {
    sideEffects.push({ target: 'upgradeExecutorEncodeFunctionData', args });
    return '0xmockdata';
  },
}));

import {
  schema as createRollupExampleSchema,
  execute as createRollupExecute,
} from '../examples/createRollup';
import { schema as transferOwnershipSchema, execute as transferOwnershipExecute } from '../examples/transferOwnership';

describe('schema coverage', () => {
  it('getValidators', async () => {
    await assertSchemaCoverage(
      getValidatorsSchema.transform(getValidatorsTransform),
      getValidators,
    );
  });

  it('setValidKeysetPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      setValidKeysetPrepareTransactionRequestSchema.transform(
        setValidKeysetPrepareTransactionRequestTransform,
      ),
      setValidKeysetPrepareTransactionRequest,
    );
  });

  it('createRollup example', async () => {
    await assertSchemaCoverage(createRollupExampleSchema, createRollupExecute, createRollupExecute);
  });

  it('transferOwnership example', async () => {
    await assertSchemaCoverage(
      transferOwnershipSchema,
      transferOwnershipExecute,
      transferOwnershipExecute,
      {
        // nativeToken controls a conditional branch (ERC20 vs ETH). Both
        // generated values are non-zero, so we need one run with zeroAddress
        // to exercise the branch difference.
        nativeToken: (base) => ({
          ...base,
          nativeToken: '0x0000000000000000000000000000000000000000',
        }),
      },
    );
  });
});
