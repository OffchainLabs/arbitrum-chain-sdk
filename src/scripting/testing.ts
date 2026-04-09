// Test utilities for schema coverage testing. Consumers use these to verify
// that every field in a composed schema affects observable side effects.
//
// Usage in a vitest file:
//
//   import { createMockRegistry, viemTransformsMocks, assertSchemaCoverage } from '@arbitrum/chain-sdk/scripting/testing';
//
//   // vi.hoisted can't import .ts, so inline createMockRegistry there
//   // (see schemaCoverage.unit.test.ts for the full pattern).
//   const mocks = vi.hoisted(() => { /* ... */ });
//
//   vi.mock('../viemTransforms', () => viemTransformsMocks(mocks));
//   vi.mock('../someSDKFunction', () => ({ someSDKFunction: mocks.fn('someSDKFunction') }));
//
//   it('all fields reach SDK calls', async () => {
//     await assertSchemaCoverage(schema, sdkFunction, mocks);
//   });

export { assertSchemaCoverage } from './schemaCoverage';

const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? `__bigint__${v}` : v);

const BIGINT_METHODS = new Set(['getGasPrice', 'readContract', 'calculateRetryableSubmissionFee']);
const HASH_METHODS = new Set(['sendRawTransaction', 'writeContract', 'signTransaction']);
const RECEIPT_METHODS = new Set(['waitForTransactionReceipt']);
const SIMULATE_METHODS = new Set(['simulateContract']);

export function createMockRegistry() {
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
}

export type MockRegistry = ReturnType<typeof createMockRegistry>;

// Pre-built vi.mock factory configs for viem helpers. Consumers pass their
// MockRegistry instance and get back the mock factory return values.
export function viemTransformsMocks(mocks: MockRegistry) {
  return {
    toPublicClient: (rpcUrl: string, chain: unknown) =>
      mocks.trackedObject(`PublicClient(${rpcUrl},${JSON.stringify(chain)})`),
    findChain: (chainId: number) => ({ _tracked: 'Chain', id: chainId }),
    toAccount: (pk: string) => mocks.trackedObject(`Account(${pk})`),
    toWalletClient: (rpcUrl: string, pk: string, chain: unknown) =>
      mocks.trackedObject(`WalletClient(${rpcUrl},${pk},${JSON.stringify(chain)})`),
  };
}
