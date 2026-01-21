import { expect, it } from 'vitest';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

import { getRollupCreatorAddress } from './getRollupCreatorAddress';
import { registerCustomParentChain } from '../chains';

import { testHelper_createCustomParentChain } from '../testHelpers';

it(`successfully returns address for Sepolia (latest)`, () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  expect(getRollupCreatorAddress(client)).toEqual('0xe06Bc77336E201c4C08751918A4bB99ddf0e1Bf7');
});

it(`successfully returns address for Sepolia (v3.2)`, () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  expect(getRollupCreatorAddress(client, 'v3.2')).toEqual(
    '0xe06Bc77336E201c4C08751918A4bB99ddf0e1Bf7',
  );
});

it(`successfully returns address for Sepolia (v2.1)`, () => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  expect(getRollupCreatorAddress(client, 'v2.1')).toEqual(
    '0xfb774eA8A92ae528A596c8D90CBCF1bdBC4Cee79',
  );
});

it(`fails to return address for an unrecognized parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  expect(() => getRollupCreatorAddress(client)).toThrowError(
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

  expect(getRollupCreatorAddress(client)).toEqual(chain.contracts.rollupCreator.address);
});
