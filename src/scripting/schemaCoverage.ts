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
//
// To mock additional SDK functions (e.g. for a new script that calls a
// function not already mocked below), add a vi.mock in your test file
// using mocks.fn() or mocks.fnSync() from the shared registry:
//
//   import { vi } from 'vitest';
//   import { mocks, assertSchemaCoverage } from './schemaCoverage';
//
//   vi.mock('../myNewFunction', () => ({
//     myNewFunction: mocks.fn('myNewFunction'),
//   }));
//
// mocks.fn(name, returnValue?)    -- async mock, returns Promise.resolve(returnValue)
// mocks.fnSync(name, returnValue?) -- sync mock, returns returnValue (or a valid hex string)
// mocks.trackedObject(name)       -- Proxy that records all method calls
//
// Optional fields get two automatic checks:
//   - a "presence" check (undefined vs a populated subtree) per optional
//     wrapper, to detect fields the transform ignores entirely;
//   - a "value" check (defined A vs defined B) per scalar leaf, to detect
//     fields where only presence matters and the value itself is dead.
// Each optional leaf test materialises only that leaf's outermost-anchor
// subtree, so unrelated optional siblings stay absent and can't cause
// cross-refine failures.
//
// Overrides augment the fixture used when testing a given key. Each entry
// has a `matches` predicate (called with the leaf/anchor key under test) and
// an `apply` function that transforms the fixture. Every matching entry is
// applied in order, so one entry can cover many related keys and multiple
// entries can compose:
//
//   await assertSchemaCoverage(schema, execute, mocks, [
//     {
//       matches: (k) => k === 'nodeConfigParams' || k.startsWith('nodeConfigParams.'),
//       apply: (base) => ({ ...base, chainConfig: { chainId: 99999 } }),
//     },
//   ]);
//
// Samples (the fifth argument) provide realistic values for specific leaves.
// They're used only on the `base` side of each check, so the generated `valB`
// still diverges. Reach for these when a pure function's synthetic inputs
// collapse to the same output (e.g. a lookup-table miss), which would
// otherwise look dead even though the field is plumbed through:
//
//   await assertSchemaCoverage(schema, execute, mocks, undefined, {
//     wasmModuleRoot: '0x6b94...',
//   });

/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';
import { type ZodType, type z } from 'zod';
import { addressSchema, hexSchema, privateKeySchema } from './schemas/common';

const _mocks = vi.hoisted(() => {
  const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? `__bigint__${v}` : v);
  const BIGINT_METHODS = new Set(['getGasPrice', 'calculateRetryableSubmissionFee']);
  const HASH_METHODS = new Set(['sendRawTransaction', 'writeContract', 'signTransaction']);
  const RECEIPT_METHODS = new Set(['waitForTransactionReceipt']);
  const SIMULATE_METHODS = new Set(['simulateContract']);
  let hexCounter = 0;
  const validHex = (bytes: number) => '0x' + (++hexCounter).toString(16).padStart(bytes * 2, '0');
  const calls: unknown[] = [];

  // Scalar properties the generic proxy should return as bigints. These show
  // up when real viem result objects (e.g. from `prepareTransactionRequest`)
  // are consumed arithmetically; without this the default "everything is a
  // method" behaviour would hand back a function and break bigint math.
  const BIGINT_PROPS = new Set(['gas', 'value', 'nonce', 'maxFeePerGas', 'maxPriorityFeePerGas']);

  function trackedObject(name: string): any {
    return new Proxy(Object.create(null), {
      get(target, prop) {
        // Values explicitly assigned on the tracked object (e.g. the real
        // code mutating `request.gas = applyPercentIncrease(...)`) must win
        // over the synthetic defaults below, otherwise those writes are
        // invisible to the harness and downstream reads look constant.
        if (Object.prototype.hasOwnProperty.call(target, prop)) {
          return (target as Record<string | symbol, unknown>)[prop as string | symbol];
        }
        if (prop === 'then') return undefined;
        if (prop === Symbol.toPrimitive) return () => validHex(20);
        if (prop === 'toJSON') return () => ({ _tracked: name });
        if (prop === 'address') return validHex(20);
        if (prop === 'chain') return { _tracked: `${name}.chain` };
        if (typeof prop === 'string' && BIGINT_PROPS.has(prop)) return 1_000_000n;
        const method = String(prop);
        return (...args: unknown[]) => {
          calls.push({ target: name, method, args: JSON.parse(JSON.stringify(args, replacer)) });
          if (method === 'readContract') {
            const fn = (args[0] as { functionName?: string } | undefined)?.functionName;
            // Contract reads whose ABI returns a tuple need an iterable result
            // or destructuring throws. Extend this list as new callers surface.
            if (fn === 'maxTimeVariation') return Promise.resolve([1n, 2n, 3n, 4n]);
            return Promise.resolve(1000000n);
          }
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

  const fn =
    (name: string, returnValue: unknown = {}) =>
    (...args: unknown[]) => {
      calls.push({
        target: name,
        method: 'call',
        args: JSON.parse(JSON.stringify(args, replacer)),
      });
      return Promise.resolve(returnValue);
    };

  const fnSync =
    (name: string, returnValue?: unknown) =>
    (...args: unknown[]) => {
      calls.push({
        target: name,
        method: 'call',
        args: JSON.parse(JSON.stringify(args, replacer)),
      });
      return returnValue ?? validHex(32);
    };

  const clear = () => {
    calls.length = 0;
    hexCounter = 0;
  };
  const snapshot = () => JSON.stringify(calls, replacer);

  return { calls, trackedObject, fn, fnSync, clear, snapshot };
});
export const mocks = _mocks;

// vi.mock calls are processed by vitest's module transform regardless of
// which file they appear in, so these mocks are active when the consuming
// test file's imports resolve.

vi.mock('./viemTransforms', () => {
  const toPublicClient = (rpcUrl: string, chain?: unknown) =>
    _mocks.trackedObject(`PublicClient(${rpcUrl},${JSON.stringify(chain)})`);
  const findChain = (chainId: number) => ({ _tracked: 'Chain', id: chainId });
  const toAccount = (pk: string) => _mocks.trackedObject(`Account(${pk})`);
  const toWalletClient = (rpcUrl: string, pk: string, chain?: unknown) =>
    _mocks.trackedObject(`WalletClient(${rpcUrl},${pk},${JSON.stringify(chain)})`);
  return {
    toPublicClient,
    findChain,
    toAccount,
    toWalletClient,
    withPublicClient: <T extends { rpcUrl: string; chainId: number }>(input: T) => {
      const { rpcUrl, chainId, ...rest } = input;
      return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
    },
    withPublicClientPositional: <T extends { rpcUrl: string; chainId: number }>(input: T) => {
      const { rpcUrl, chainId, ...rest } = input;
      return [toPublicClient(rpcUrl, findChain(chainId)), rest];
    },
    withPublicClientOptionalChain: <T extends { rpcUrl: string; chainId?: number }>(input: T) => {
      const { rpcUrl, chainId, ...rest } = input;
      return [
        { publicClient: toPublicClient(rpcUrl, chainId ? findChain(chainId) : undefined), ...rest },
      ];
    },
    withParentChainPublicClient: <T extends { parentChainRpcUrl: string; parentChainId: number }>(
      input: T,
    ) => {
      const { parentChainRpcUrl, parentChainId, ...rest } = input;
      return [
        {
          parentChainPublicClient: toPublicClient(parentChainRpcUrl, findChain(parentChainId)),
          ...rest,
        },
      ];
    },
    withChainSign: <T extends { rpcUrl: string; chainId: number; privateKey: string }>(
      input: T,
    ) => {
      const { rpcUrl, chainId, privateKey, ...rest } = input;
      return [
        {
          publicClient: toPublicClient(rpcUrl, findChain(chainId)),
          account: toAccount(privateKey),
          ...rest,
        },
      ];
    },
    withParentChainSign: <
      T extends { parentChainRpcUrl: string; parentChainId: number; privateKey: string },
    >(
      input: T,
    ) => {
      const { parentChainRpcUrl, parentChainId, privateKey, ...rest } = input;
      return [
        {
          parentChainPublicClient: toPublicClient(parentChainRpcUrl, findChain(parentChainId)),
          account: toAccount(privateKey),
          ...rest,
        },
      ];
    },
    withChildChainSign: <
      T extends { orbitChainRpcUrl: string; orbitChainId: number; privateKey: string },
    >(
      input: T,
    ) => {
      const { orbitChainRpcUrl, orbitChainId, privateKey, ...rest } = input;
      return [
        {
          orbitChainWalletClient: toWalletClient(
            orbitChainRpcUrl,
            privateKey,
            findChain(orbitChainId),
          ),
          ...rest,
        },
      ];
    },
    withParentReadChildSign: <
      T extends {
        parentChainRpcUrl: string;
        parentChainId: number;
        orbitChainRpcUrl: string;
        privateKey: string;
      },
    >(
      input: T,
    ) => {
      const { parentChainRpcUrl, parentChainId, orbitChainRpcUrl, privateKey, ...rest } = input;
      return [
        {
          parentChainPublicClient: toPublicClient(parentChainRpcUrl, findChain(parentChainId)),
          orbitChainWalletClient: toWalletClient(orbitChainRpcUrl, privateKey),
          ...rest,
        },
      ];
    },
  };
});

vi.mock('./scriptUtils', () => ({ runScript: () => {} }));

// Generated `parentChainId` values are synthetic integers. The real
// `validateParentChain` rejects anything not in its supported-chain list,
// which would trip coverage runs before they reach the mocks. Echo the
// input back so the coverage harness can still observe value changes.
vi.mock('../types/ParentChain', () => ({
  validateParentChain: (chainIdOrClient: unknown) => {
    const chainId =
      typeof chainIdOrClient === 'number'
        ? chainIdOrClient
        : (chainIdOrClient as { chain?: { id?: number } } | undefined)?.chain?.id ?? 1;
    return { chainId, isCustom: false };
  },
}));

// The real `getParentChainBlockTime` returns 2 or 12 depending on chain id.
// That collapses the synthetic chain ids the harness generates into the same
// bucket, masking genuine field usage downstream in the getDefault* helpers.
// Echo the id so snapshots vary with the input.
vi.mock('../getParentChainBlockTime', () => ({
  getParentChainBlockTime: (chainId: number) => chainId,
}));

vi.mock('../createRollupPrepareDeploymentParamsConfig', () => ({
  createRollupPrepareDeploymentParamsConfig: _mocks.fnSync(
    'createRollupPrepareDeploymentParamsConfig',
    {
      _mock: 'deploymentParamsConfig',
    },
  ),
}));
vi.mock('../prepareChainConfig', () => ({
  prepareChainConfig: _mocks.fnSync('prepareChainConfig', { _mock: 'chainConfig' }),
}));

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
  createRollupPrepareCustomFeeTokenApprovalTransactionRequest: _mocks.fn(
    'createRollupPrepareCustomFeeTokenApproval',
  ),
}));
vi.mock('../createTokenBridgeEnoughCustomFeeTokenAllowance', () => ({
  createTokenBridgeEnoughCustomFeeTokenAllowance: _mocks.fn(
    'createTokenBridgeEnoughCustomFeeTokenAllowance',
  ),
}));
vi.mock('../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest', () => ({
  createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest: _mocks.fn(
    'createTokenBridgePrepareCustomFeeTokenApproval',
  ),
}));
vi.mock('../createRollupPrepareTransactionRequest', () => ({
  createRollupPrepareTransactionRequest: _mocks.fn('createRollupPrepareTransactionRequest'),
}));
vi.mock('../createTokenBridge', () => ({ createTokenBridge: _mocks.fn('createTokenBridge') }));
vi.mock('../createTokenBridgePrepareTransactionRequest', () => ({
  createTokenBridgePrepareTransactionRequest: _mocks.fn(
    'createTokenBridgePrepareTransactionRequest',
  ),
}));
vi.mock('../createTokenBridgePrepareSetWethGatewayTransactionRequest', () => ({
  createTokenBridgePrepareSetWethGatewayTransactionRequest: _mocks.fn(
    'createTokenBridgePrepareSetWethGateway',
  ),
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
vi.mock('../utils/generateChainId', () => ({
  generateChainId: _mocks.fnSync('generateChainId', 999999),
}));
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

/**
 * A testable leaf of a schema -- a scalar field the harness will vary when
 * running coverage.
 */
type SchemaLeaf = {
  /** Dotted-path components from the schema root to this leaf. */
  path: string[];
  /** The innermost zod type (optional/default wrappers peeled). */
  schema: ZodType;
  /**
   * True if any ancestor in the schema is `z.optional()` or `z.nullable()`;
   * gates whether this leaf gets a presence check.
   */
  optional: boolean;
};

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

/**
 * Result of walking a schema once. Leaves inherit the optional flag from
 * any optional ancestor.
 */
type SchemaWalk = {
  /** Scalar leaves the harness will test. */
  leaves: SchemaLeaf[];
  /**
   * Paths where a `z.optional()` / `z.nullable()` wrapper sits. Each is a
   * candidate for a presence check (undefined vs populated subtree).
   */
  anchors: string[][];
};

function walkSchema(schema: ZodType, path: string[], optional: boolean, out: SchemaWalk): void {
  // Treat canonical refined-string schemas as atomic leaves so the generator
  // can produce values that pass their viem-backed validators (isAddress, isHex).
  if (schema === addressSchema || schema === hexSchema || schema === privateKeySchema) {
    out.leaves.push({ path, schema, optional });
    return;
  }
  const def = getDef(schema);
  if (!def) {
    out.leaves.push({ path, schema, optional });
    return;
  }
  switch (def.type) {
    case 'object':
      for (const [key, child] of Object.entries(def.shape as Record<string, ZodType>)) {
        walkSchema(child, [...path, key], optional, out);
      }
      return;
    case 'never':
      return;
    case 'optional':
    case 'nullable':
      out.anchors.push(path);
      walkSchema(def.innerType, path, true, out);
      return;
    case 'nonoptional':
      walkSchema(stripOptional(def.innerType), path, optional, out);
      return;
    case 'default':
    case 'prefault':
    case 'readonly':
    case 'catch':
      walkSchema(def.innerType, path, optional, out);
      return;
    case 'pipe':
      walkSchema(def.in, path, optional, out);
      return;
    case 'union':
      walkSchema(def.options[0], path, optional, out);
      return;
    default:
      out.leaves.push({ path, schema, optional });
  }
}

function generateValue(schema: ZodType): unknown {
  return generateForType(schema, counter++);
}

function generateForType(schema: ZodType, n: number): unknown {
  if (schema === addressSchema) return `0x${(n + 1).toString(16).padStart(40, '0')}`;
  if (schema === hexSchema) return `0x${(n + 1).toString(16)}`;
  if (schema === privateKeySchema) return `0x${(n + 1).toString(16).padStart(64, '0')}`;

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

function setNestedField(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) return obj;
  if (path.length === 1) return { ...obj, [path[0]]: value };
  const [head, ...rest] = path;
  return {
    ...obj,
    [head]: setNestedField((obj[head] as Record<string, unknown>) ?? {}, rest, value),
  };
}

function buildFixture(
  leaves: SchemaLeaf[],
  values: Map<string, unknown>,
  includeOptional: boolean,
): Record<string, unknown> {
  let fixture: Record<string, unknown> = {};
  for (const leaf of leaves) {
    if (leaf.optional && !includeOptional) continue;
    fixture = setNestedField(fixture, leaf.path, values.get(leaf.path.join('.')));
  }
  return fixture;
}

function isPathPrefix(prefix: string[], path: string[]): boolean {
  if (prefix.length > path.length) return false;
  for (let i = 0; i < prefix.length; i++) if (prefix[i] !== path[i]) return false;
  return true;
}

// Populates the required-only base fixture with the subtree rooted at
// `rootPath`. Leaves outside the subtree remain in their base (sparse) state.
// This keeps optional-leaf tests from cross-polluting unrelated optional
// subtrees (e.g. refines that fail when a sibling optional field is present).
function materializeSubtree(
  base: Record<string, unknown>,
  leaves: SchemaLeaf[],
  rootPath: string[],
  values: Map<string, unknown>,
): Record<string, unknown> {
  let fx = base;
  for (const leaf of leaves) {
    if (!isPathPrefix(rootPath, leaf.path)) continue;
    fx = setNestedField(fx, leaf.path, values.get(leaf.path.join('.')));
  }
  return fx;
}

// Expands a schema into its discriminator variants for independent coverage.
// The harness walks only the first union option when collecting leaves, so a
// `z.union([v21, v32, default])` would only cover v21's fields unless callers
// iterate variants explicitly.
export function getSchemaVariants(schema: ZodType): readonly ZodType[] {
  const def = getDef(schema);
  return def?.type === 'union' ? (def.options as ZodType[]) : [schema];
}

// Best-effort label for a variant: picks the first literal field inside the
// variant's input object, or a `z.never().optional()` field as "default".
// Returns null if no obvious discriminator is found.
export function getVariantLabel(variant: ZodType): string | null {
  let current: ZodType = variant;
  for (let i = 0; i < 8; i++) {
    const def = getDef(current);
    if (!def) return null;
    if (def.type === 'object') {
      for (const child of Object.values(def.shape as Record<string, ZodType>)) {
        const childDef = getDef(child);
        if (childDef?.type === 'literal') return String(childDef.values[0]);
        if (childDef?.type === 'optional' && getDef(childDef.innerType)?.type === 'never') {
          return 'default';
        }
      }
      return null;
    }
    if (
      def.type === 'pipe' ||
      def.type === 'default' ||
      def.type === 'prefault' ||
      def.type === 'readonly' ||
      def.type === 'catch'
    ) {
      current = def.type === 'pipe' ? def.in : def.innerType;
      continue;
    }
    return null;
  }
  return null;
}

function outermostAnchor(leafPath: string[], anchors: string[][]): string[] | null {
  let best: string[] | null = null;
  for (const a of anchors) {
    if (!isPathPrefix(a, leafPath)) continue;
    if (best === null || a.length < best.length) best = a;
  }
  return best;
}

/**
 * Augmentation applied to the `base` fixture during a coverage run. Useful
 * for satisfying schema refines or supplying sibling context that the leaf
 * under test depends on. Multiple overrides can match a single key and are
 * composed in order. See the file header for a usage example.
 */
export type CoverageOverride<T extends ZodType> = {
  /** Returns true for the leaf/anchor keys this override should fire on. */
  matches: (key: string) => boolean;
  /** Transforms the fixture; returns the next state. */
  apply: (base: z.input<T>) => z.input<T>;
};

/**
 * Checks that every field in a schema is actually used. If a field can be
 * changed without affecting what the SDK function receives, it's dead --
 * the user is providing a value that doesn't matter.
 *
 * Works by generating two inputs that differ in one field at a time,
 * running both through the pipeline, and failing if the outputs match.
 */
export async function assertSchemaCoverage<T extends ZodType>(
  schema: T,
  execute: (...args: any[]) => unknown,
  registry: typeof _mocks,
  overrides?: readonly CoverageOverride<T>[],
  // Realistic sample values keyed by dotted leaf path. Used for the `base`
  // input when a pure function's synthetic inputs would collapse to the same
  // output (e.g. a lookup-table miss returning the same `undefined`/`false`
  // for any non-matching value). Leaving valuesB synthetic means base and
  // mutated land in different code-path buckets, letting the harness observe
  // the field as live.
  samples?: Readonly<Record<string, unknown>>,
): Promise<void> {
  const walk: SchemaWalk = { leaves: [], anchors: [] };
  walkSchema(schema, [], false, walk);
  const { leaves, anchors } = walk;

  const isTestable = (leaf: SchemaLeaf): boolean => {
    const t = getDefType(leaf.schema);
    return t !== 'literal' && t !== 'null';
  };
  if (!leaves.some(isTestable)) {
    throw new Error(
      'assertSchemaCoverage found 0 testable fields. ' +
        'The schema may be empty or walkSchema may not support a type it uses.',
    );
  }

  resetCounter();
  const valuesA = new Map<string, unknown>();
  const valuesB = new Map<string, unknown>();
  for (const leaf of leaves) {
    const key = leaf.path.join('.');
    const generatedA = generateValue(leaf.schema);
    valuesA.set(key, samples && key in samples ? samples[key] : generatedA);
    valuesB.set(key, generateValue(leaf.schema));
  }

  const baseFixture = buildFixture(leaves, valuesA, false) as Record<string, unknown>;
  const deadFields: string[] = [];

  const applyOverride = (fixture: Record<string, unknown>, key: string): Record<string, unknown> =>
    overrides
      ? (overrides.reduce<z.input<T>>(
          (acc, o) => (o.matches(key) ? o.apply(acc) : acc),
          fixture as z.input<T>,
        ) as Record<string, unknown>)
      : fixture;

  const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? `__bigint__${v}` : v);

  const runSnapshot = async (input: Record<string, unknown>): Promise<string> => {
    registry.clear();
    const parsed = schema.parse(input) as any;
    const result = await (Array.isArray(parsed) ? execute(...parsed) : execute(parsed));
    return registry.snapshot() + JSON.stringify(result, replacer);
  };

  // Presence tests: one per distinct optional anchor. Materialize from the
  // outermost containing anchor so required siblings of any enclosing optional
  // object are populated -- otherwise a nested anchor would yield a partial
  // parent object. Anchors whose inner type produces no leaves (e.g.
  // `z.never().optional()`) are skipped: no valid populated state exists.
  const seenAnchors = new Set<string>();
  for (const anchor of anchors) {
    if (anchor.length === 0) continue;
    const key = anchor.join('.');
    if (seenAnchors.has(key)) continue;
    seenAnchors.add(key);
    if (!leaves.some((l) => isPathPrefix(anchor, l.path))) continue;

    const root = outermostAnchor(anchor, anchors)!;
    const materialized = materializeSubtree(baseFixture, leaves, root, valuesA);
    const present = applyOverride(materialized, key);
    const absent = setNestedField(present, anchor, undefined);

    if ((await runSnapshot(present)) === (await runSnapshot(absent))) {
      deadFields.push(`${key} (presence)`);
    }
  }

  for (const leaf of leaves) {
    if (!isTestable(leaf)) continue;
    const key = leaf.path.join('.');

    const anchor = leaf.optional ? outermostAnchor(leaf.path, anchors) : null;
    const minimal = anchor ? materializeSubtree(baseFixture, leaves, anchor, valuesA) : baseFixture;
    const base = applyOverride(minimal, key);
    const mutated = setNestedField(base, leaf.path, valuesB.get(key));

    if ((await runSnapshot(base)) === (await runSnapshot(mutated))) {
      deadFields.push(leaf.optional ? `${key} (value)` : key);
    }
  }

  if (deadFields.length > 0) {
    throw new Error(
      `Dead schema fields detected (no effect on transform output):\n  ${deadFields.join('\n  ')}`,
    );
  }
}
