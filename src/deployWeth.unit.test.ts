import { describe, it, expect } from 'vitest';

import testWeth9 from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/test/TestWETH9.sol/TestWETH9.json';

type AbiEntry = { type: string; name?: string; inputs?: { type: string }[] };

// Assert the artifact resolves with populated bytecode and the expected constructor/interface, so a
// bad import path or changed signature fails here rather than at deploy time.
describe('deployWeth artifact', () => {
  it('resolves TestWETH9 with populated bytecode', () => {
    expect(testWeth9.bytecode.startsWith('0x')).toBe(true);
    expect(testWeth9.bytecode.length).toBeGreaterThan(2);
  });

  it('has a (string, string) constructor and the WETH9 interface', () => {
    const abi = testWeth9.abi as AbiEntry[];

    const constructor = abi.find((entry) => entry.type === 'constructor');
    expect(constructor?.inputs?.map((input) => input.type)).toEqual(['string', 'string']);

    const functionNames = abi
      .filter((entry) => entry.type === 'function')
      .map((entry) => entry.name);
    for (const name of ['deposit', 'withdraw', 'name', 'symbol', 'decimals']) {
      expect(functionNames).toContain(name);
    }
  });
});
