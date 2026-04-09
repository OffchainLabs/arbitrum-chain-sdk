// Shared call tracker for mock side effects in schema coverage tests.
// Lives in its own module so vi.mock factories can require() it.

export const sideEffects: unknown[] = [];

// Known methods that must return specific types for execute to proceed.
// Everything else returns a tracked proxy.
const BIGINT_METHODS = new Set(['getGasPrice', 'readContract', 'calculateRetryableSubmissionFee']);
const STRING_METHODS = new Set([
  'sendRawTransaction',
  'writeContract',
  'signTransaction',
  'encodeFunctionData',
]);
const RECEIPT_METHODS = new Set(['waitForTransactionReceipt']);
const SIMULATE_METHODS = new Set(['simulateContract']);

function returnValueFor(method: string, name: string): unknown {
  if (BIGINT_METHODS.has(method)) return 1000000n;
  if (STRING_METHODS.has(method)) return `0x${name}`.slice(0, 66).padEnd(66, '0');
  if (RECEIPT_METHODS.has(method)) return { blockNumber: 1n };
  if (SIMULATE_METHODS.has(method)) return { request: { _tracked: `${name}.request` } };
  return createTrackedObject(`${name}`);
}

// Creates an object whose methods record calls into sideEffects. Method
// return values are determined by the method name -- known methods return
// realistic types (bigint, string, receipt), everything else returns
// another tracked proxy.
export function createTrackedObject(name: string): any {
  return new Proxy(Object.create(null), {
    get(_, prop) {
      if (prop === 'then') return undefined;
      if (prop === Symbol.toPrimitive) return () => `mock:${name}`;
      if (prop === 'toJSON') return () => ({ _tracked: name });
      if (prop === 'address') return `0x${name}_address`.slice(0, 42).padEnd(42, '0');
      if (prop === 'chain') return { _tracked: `${name}.chain` };

      const method = String(prop);
      return (...args: unknown[]) => {
        sideEffects.push({ target: name, method, args });
        const result = returnValueFor(method, `${name}.${method}()`);
        return Promise.resolve(result);
      };
    },
  });
}
