import { expect, it } from 'vitest';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

import { getTokenBridgeCreatorAddress } from './getTokenBridgeCreatorAddress';
import { registerCustomParentChain } from '../chains';

import { testHelper_createCustomParentChain } from '../testHelpers';

it(`successfully returns address for Sepolia`, () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  expect(getTokenBridgeCreatorAddress(client)).toEqual(
    '0x7edb2dfBeEf9417e0454A80c51EE0C034e45a570',
  );
});

it(`fails to return address for an unrecognized parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  expect(() => getTokenBridgeCreatorAddress(client)).toThrowError(
    `Parent chain not supported: ${chain.id}`,
  );
});

it(`successfully returns address for a registered custom parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  registerCustomParentChain(chain);

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  expect(getTokenBridgeCreatorAddress(client)).toEqual(chain.contracts.tokenBridgeCreator.address);
});
