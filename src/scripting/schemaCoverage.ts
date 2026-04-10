// Shared test infrastructure for schema coverage testing. Importing this file
// sets up all mocks needed to test schema transforms and example scripts.
//
// Usage:
//   import { mocks, assertSchemaCoverage } from './schemaCoverage';
//   import { someSchema, someTransform } from './schemas/some';
//   import { someFunction } from '../someFunction';
//
//   it('some', async () => {
//     await assertSchemaCoverage(someSchema.transform(someTransform), someFunction, mocks);
//   });

import { vi } from 'vitest';
import { type ZodType, type z } from 'zod';

// -- Mock registry -----------------------------------------------------------

const _mocks = vi.hoisted(() => {
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
export const mocks = _mocks;

// -- Module mocks ------------------------------------------------------------
// vi.mock is statically analyzed and hoisted in any file that imports this
// module, so these take effect before imports in the consuming test file.

vi.mock('./viemTransforms', () => ({
  toPublicClient: (rpcUrl: string, chain: unknown) =>
    _mocks.trackedObject(`PublicClient(${rpcUrl},${JSON.stringify(chain)})`),
  findChain: (chainId: number) => ({ _tracked: 'Chain', id: chainId }),
  toAccount: (pk: string) => _mocks.trackedObject(`Account(${pk})`),
  toWalletClient: (rpcUrl: string, pk: string, chain: unknown) =>
    _mocks.trackedObject(`WalletClient(${rpcUrl},${pk},${JSON.stringify(chain)})`),
}));

vi.mock('./scriptUtils', () => ({ runScript: () => {} }));

// Functions called inside schema transforms
vi.mock('../createRollupPrepareDeploymentParamsConfig', () => ({
  createRollupPrepareDeploymentParamsConfig: _mocks.fnSync('createRollupPrepareDeploymentParamsConfig', {
    _mock: 'deploymentParamsConfig',
  }),
}));
vi.mock('../prepareChainConfig', () => ({
  prepareChainConfig: _mocks.fnSync('prepareChainConfig', { _mock: 'chainConfig' }),
}));

// SDK functions
vi.mock('../getValidators', () => ({ getValidators: _mocks.fn('getValidators') }));
vi.mock('../setValidKeysetPrepareTransactionRequest', () => ({
  setValidKeysetPrepareTransactionRequest: _mocks.fn('setValidKeysetPrepareTransactionRequest'),
}));
vi.mock('../getKeysets', () => ({ getKeysets: _mocks.fn('getKeysets') }));
vi.mock('../getBatchPosters', () => ({ getBatchPosters: _mocks.fn('getBatchPosters') }));
vi.mock('../isAnyTrust', () => ({ isAnyTrust: _mocks.fn('isAnyTrust') }));
vi.mock('../prepareKeysetHash', () => ({ prepareKeysetHash: _mocks.fn('prepareKeysetHash') }));
vi.mock('../prepareKeyset', () => ({ prepareKeyset: _mocks.fn('prepareKeyset') }));
vi.mock('../setAnyTrustFastConfirmerPrepareTransactionRequest', () => ({
  setAnyTrustFastConfirmerPrepareTransactionRequest: _mocks.fn('setAnyTrustFastConfirmer'),
}));
vi.mock('../createRollupFetchCoreContracts', () => ({
  createRollupFetchCoreContracts: _mocks.fn('createRollupFetchCoreContracts'),
}));
vi.mock('../createRollupFetchTransactionHash', () => ({
  createRollupFetchTransactionHash: _mocks.fn('createRollupFetchTransactionHash'),
}));
vi.mock('../utils/erc20', () => ({
  fetchAllowance: _mocks.fn('fetchAllowance'),
  fetchDecimals: _mocks.fn('fetchDecimals'),
}));
vi.mock('../upgradeExecutorFetchPrivilegedAccounts', () => ({
  upgradeExecutorFetchPrivilegedAccounts: _mocks.fn('upgradeExecutorFetchPrivilegedAccounts'),
}));
vi.mock('../getBridgeUiConfig', () => ({ getBridgeUiConfig: _mocks.fn('getBridgeUiConfig') }));
vi.mock('../isTokenBridgeDeployed', () => ({ isTokenBridgeDeployed: _mocks.fn('isTokenBridgeDeployed') }));
vi.mock('../createRollupGetRetryablesFees', () => ({
  createRollupGetRetryablesFees: _mocks.fn('createRollupGetRetryablesFees'),
}));
vi.mock('../createSafePrepareTransactionRequest', () => ({
  createSafePrepareTransactionRequest: _mocks.fn('createSafePrepareTransactionRequest'),
}));
vi.mock('../createRollupEnoughCustomFeeTokenAllowance', () => ({
  createRollupEnoughCustomFeeTokenAllowance: _mocks.fn('createRollupEnoughCustomFeeTokenAllowance'),
}));
vi.mock('../createRollupPrepareCustomFeeTokenApprovalTransactionRequest', () => ({
  createRollupPrepareCustomFeeTokenApprovalTransactionRequest: _mocks.fn('createRollupPrepareCustomFeeTokenApproval'),
}));
vi.mock('../createTokenBridgeEnoughCustomFeeTokenAllowance', () => ({
  createTokenBridgeEnoughCustomFeeTokenAllowance: _mocks.fn('createTokenBridgeEnoughCustomFeeTokenAllowance'),
}));
vi.mock('../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest', () => ({
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest: _mocks.fn('createTokenBridgePrepareCustomFeeTokenApproval'),
}));
vi.mock('../createRollupPrepareTransactionRequest', () => ({
  createRollupPrepareTransactionRequest: _mocks.fn('createRollupPrepareTransactionRequest'),
}));
vi.mock('../createTokenBridge', () => ({ createTokenBridge: _mocks.fn('createTokenBridge') }));
vi.mock('../createTokenBridgePrepareTransactionRequest', () => ({
  createTokenBridgePrepareTransactionRequest: _mocks.fn('createTokenBridgePrepareTransactionRequest'),
}));
vi.mock('../createTokenBridgePrepareSetWethGatewayTransactionRequest', () => ({
  createTokenBridgePrepareSetWethGatewayTransactionRequest: _mocks.fn('createTokenBridgePrepareSetWethGateway'),
}));
vi.mock('../feeRouterDeployRewardDistributor', () => ({
  feeRouterDeployRewardDistributor: _mocks.fn('feeRouterDeployRewardDistributor'),
}));
vi.mock('../feeRouterDeployChildToParentRewardRouter', () => ({
  feeRouterDeployChildToParentRewardRouter: _mocks.fn('feeRouterDeployChildToParentRewardRouter'),
}));
vi.mock('../prepareNodeConfig', () => ({ prepareNodeConfig: _mocks.fn('prepareNodeConfig') }));
vi.mock('../getDefaultConfirmPeriodBlocks', () => ({
  getDefaultConfirmPeriodBlocks: _mocks.fn('getDefaultConfirmPeriodBlocks'),
}));
vi.mock('../createRollup', () => ({
  createRollup: _mocks.fn('createRollup', { coreContracts: {} }),
}));
vi.mock('../setValidKeyset', () => ({ setValidKeyset: _mocks.fn('setValidKeyset') }));
vi.mock('../utils/generateChainId', () => ({ generateChainId: () => 999999 }));
vi.mock('../upgradeExecutorPrepareAddExecutorTransactionRequest', () => ({
  upgradeExecutorPrepareAddExecutorTransactionRequest: _mocks.fn('addExecutor'),
}));
vi.mock('../upgradeExecutorPrepareRemoveExecutorTransactionRequest', () => ({
  upgradeExecutorPrepareRemoveExecutorTransactionRequest: _mocks.fn('removeExecutor'),
}));
vi.mock('../upgradeExecutorEncodeFunctionData', () => ({
  UPGRADE_EXECUTOR_ROLE_EXECUTOR: '0x' + 'ab'.repeat(32),
  upgradeExecutorEncodeFunctionData: _mocks.fnSync('upgradeExecutorEncodeFunctionData'),
}));
vi.mock('viem', async (importOriginal) => {
  const original = await importOriginal<typeof import('viem')>();
  return {
    ...original,
    encodeFunctionData: _mocks.fnSync('encodeFunctionData'),
    createWalletClient: (opts: any) =>
      _mocks.trackedObject(`childWalletClient(${JSON.stringify(opts?.chain?.id ?? opts)})`),
    custom: () => ({}),
    defineChain: (def: any) => def,
  };
});

// -- Schema coverage utility -------------------------------------------------

type SchemaLeaf = { path: string[]; schema: ZodType };

let counter = 0;

function resetCounter(): void {
  counter = 0;
}

function getDefType(schema: ZodType): string {
  return (schema as any)._zod?.def?.type ?? 'unknown';
}

function getDef(schema: ZodType): any {
  return (schema as any)._zod?.def;
}

function getBag(schema: ZodType): any {
  return (schema as any)._zod?.bag;
}

function stripOptional(schema: ZodType): ZodType {
  const def = getDef(schema);
  if (def?.type === 'optional' || def?.type === 'nullable') return def.innerType;
  return schema;
}

function getSchemaLeaves(schema: ZodType, path: string[] = []): SchemaLeaf[] {
  const def = getDef(schema);
  if (!def) return [{ path, schema }];

  switch (def.type) {
    case 'object': {
      const shape = def.shape as Record<string, ZodType>;
      return Object.entries(shape).flatMap(([key, child]) =>
        getSchemaLeaves(child, [...path, key]),
      );
    }
    case 'never':
    case 'optional':
    case 'nullable':
      return [];
    case 'nonoptional':
      return getSchemaLeaves(stripOptional(def.innerType), path);
    case 'default':
    case 'prefault':
    case 'readonly':
    case 'catch':
      return getSchemaLeaves(def.innerType, path);
    case 'pipe':
      return getSchemaLeaves(def.in, path);
    case 'union':
      return getSchemaLeaves(def.options[0], path);
    default:
      return [{ path, schema }];
  }
}

function generateValue(schema: ZodType): unknown {
  return generateForType(schema, counter++);
}

function generateForType(schema: ZodType, n: number): unknown {
  const def = getDef(schema);
  if (!def) throw new Error(`Cannot generate value: schema has no def`);

  switch (def.type) {
    case 'string':
      return generateString(schema, n);
    case 'number':
      return n + 1;
    case 'int':
      return n + 1;
    case 'boolean':
      return n % 2 === 0;
    case 'null':
      return null;
    case 'bigint':
      return BigInt(n + 1);
    case 'literal':
      return def.values[0];
    case 'enum':
      return Object.values(def.entries)[n % Object.values(def.entries).length];
    case 'object':
      return generateObject(schema, n);
    case 'array':
      return [generateForType(def.element, n)];
    case 'tuple':
      return (def.items as ZodType[]).map((item: ZodType, i: number) =>
        generateForType(item, n + i),
      );
    case 'optional':
    case 'nullable':
      return undefined;
    case 'nonoptional':
      return generateForType(stripOptional(def.innerType), n);
    case 'default':
    case 'prefault':
    case 'readonly':
    case 'catch':
      return generateForType(def.innerType, n);
    case 'pipe':
      return generateForType(def.in, n);
    case 'union':
      return generateForType(def.options[0], n);
    default:
      throw new Error(
        `Unsupported zod type "${def.type}" at counter ${n}. Add a case to generateForType.`,
      );
  }
}

function generateString(schema: ZodType, n: number): string {
  const bag = getBag(schema);
  if (bag?.format === 'url') return `http://host-${n}.test`;
  const patterns = bag?.patterns as Set<RegExp> | undefined;
  if (patterns) {
    for (const pattern of patterns) {
      const src = pattern.source;
      if (src.includes('[0-9a-fA-F]{40}')) return `0x${(n + 1).toString(16).padStart(40, '0')}`;
      if (src.includes('[0-9a-fA-F]{64}')) return `0x${(n + 1).toString(16).padStart(64, '0')}`;
      if (src.includes('[0-9a-fA-F]')) return `0x${(n + 1).toString(16)}`;
      if (src.includes('-?\\d+')) return String(n + 100);
    }
  }
  return `string_${n}`;
}

function generateObject(schema: ZodType, baseN: number): Record<string, unknown> {
  const shape = getDef(schema).shape as Record<string, ZodType>;
  const result: Record<string, unknown> = {};
  let i = baseN;
  for (const [key, child] of Object.entries(shape)) {
    result[key] = generateForType(child, i++);
  }
  return result;
}

function setNestedField(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  if (path.length === 0) return obj;
  if (path.length === 1) return { ...obj, [path[0]]: value };
  const [head, ...rest] = path;
  return {
    ...obj,
    [head]: setNestedField((obj[head] as Record<string, unknown>) ?? {}, rest, value),
  };
}

function buildFixture(leaves: SchemaLeaf[], values: Map<string, unknown>): Record<string, unknown> {
  let fixture: Record<string, unknown> = {};
  for (const leaf of leaves) {
    fixture = setNestedField(fixture, leaf.path, values.get(leaf.path.join('.')));
  }
  return fixture;
}

/**
 * Verifies that every field in a schema affects observable side effects.
 * For each leaf field, generates two inputs that differ only in that field,
 * runs both through execute, and asserts the recorded side effects differ.
 */
export async function assertSchemaCoverage<T extends ZodType>(
  schema: T,
  execute: (...args: any[]) => unknown,
  registry: typeof _mocks,
  overrides?: Record<string, (base: z.input<T>) => z.input<T>>,
): Promise<void> {
  const leaves = getSchemaLeaves(schema);

  resetCounter();
  const valuesA = new Map<string, unknown>();
  const valuesB = new Map<string, unknown>();
  const keys = new Map<SchemaLeaf, string>();
  for (const leaf of leaves) {
    const key = leaf.path.join('.');
    keys.set(leaf, key);
    valuesA.set(key, generateValue(leaf.schema));
    valuesB.set(key, generateValue(leaf.schema));
  }

  const baseFixture = buildFixture(leaves, valuesA) as z.input<T>;
  const deadFields: string[] = [];

  for (const leaf of leaves) {
    const key = keys.get(leaf)!;
    const leafType = getDefType(leaf.schema);
    if (leafType === 'literal' || leafType === 'null') continue;

    const base = overrides?.[key] ? overrides[key](baseFixture) : baseFixture;

    let mutated = overrides?.[key] ? overrides[key](baseFixture) : baseFixture;
    mutated = setNestedField(
      mutated as Record<string, unknown>, leaf.path, valuesB.get(key),
    ) as z.input<T>;

    registry.clear();
    const parsedBase = schema.parse(base) as any;
    await (Array.isArray(parsedBase) ? execute(...parsedBase) : execute(parsedBase));
    const snapshotBase = registry.snapshot();

    registry.clear();
    const parsedMutated = schema.parse(mutated) as any;
    await (Array.isArray(parsedMutated) ? execute(...parsedMutated) : execute(parsedMutated));
    const snapshotMutated = registry.snapshot();

    if (snapshotBase === snapshotMutated) deadFields.push(key);
  }

  if (deadFields.length > 0) {
    throw new Error(
      `Dead schema fields detected (no effect on transform output):\n  ${deadFields.join('\n  ')}`,
    );
  }
}
