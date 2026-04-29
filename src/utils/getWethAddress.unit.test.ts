import { expect, it } from 'vitest';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

import { getWethAddress } from './getWethAddress';
import { registerCustomParentChain } from '../chains';

import { testHelper_createCustomParentChain } from '../testHelpers';

it(`successfully returns address for Sepolia`, () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  expect(getWethAddress(client)).toEqual('0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9');
});

it(`fails to return address for an unrecognized parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  expect(() => getWethAddress(client)).toThrowError(`Parent chain not supported: ${chain.id}`);
});

it(`successfully returns address for a registered custom parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  registerCustomParentChain(chain);

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  expect(getWethAddress(client)).toEqual(chain.contracts.weth.address);
});
