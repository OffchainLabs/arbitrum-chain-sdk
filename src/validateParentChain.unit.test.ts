import { it, expect } from 'vitest';
import { Chain, ChainContract, getAddress } from 'viem';

import { validateParentChain } from './types/ParentChain';
import { arbitrumOne, base, registerCustomParentChain } from './chains';
import { generateChainId } from './utils';
import { getParentChainFromId } from './utils/getParentChainFromId';

import { testHelper_createCustomParentChain } from './testHelpers';

it(`sucessfully validates arbitrum one`, () => {
  const result = validateParentChain(arbitrumOne.id);

  expect(result.chainId).toEqual(arbitrumOne.id);
  expect(result.isCustom).toEqual(false);
});

it(`throws for an unregistered custom parent chain`, () => {
  const id = generateChainId();

  expect(() => validateParentChain(id)).toThrowError(`Parent chain not supported: ${id}`);
});

it(`sucessfully validates a registered custom parent chain`, () => {
  const chain = testHelper_createCustomParentChain();

  registerCustomParentChain(chain);

  const result = validateParentChain(chain.id);

  expect(result.chainId).toEqual(chain.id);
  expect(result.isCustom).toEqual(true);
});

it(`registers a custom parent chain without creator addresses`, () => {
  const id = generateChainId();
  const chain = {
    id,
    name: `No-creator chain (${id})`,
    network: `no-creator-chain-${id}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      public: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
      default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    },
  } satisfies Chain;

  expect(() => registerCustomParentChain(chain)).not.toThrow();
  expect(validateParentChain(id).isCustom).toEqual(true);
});

it(`resolves a custom parent chain that shadows a built-in id to the custom one`, () => {
  const chain = testHelper_createCustomParentChain({ id: base.id });

  registerCustomParentChain(chain);

  const result = validateParentChain(base.id);
  expect(result.isCustom).toEqual(true);

  // custom-first resolution: the registered chain's factory address wins over the
  // contract-less built-in entry for the same id.
  const resolved = getParentChainFromId(base.id);
  const resolvedRollupCreator = resolved.contracts?.rollupCreator as ChainContract | undefined;
  expect(getAddress(resolvedRollupCreator!.address)).toEqual(
    getAddress(chain.contracts.rollupCreator.address),
  );
});
