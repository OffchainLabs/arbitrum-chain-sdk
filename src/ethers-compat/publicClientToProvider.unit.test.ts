import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

import { publicClientToProvider } from './publicClientToProvider';

it(`successfully converts PublicClient to Provider`, () => {
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  const provider = publicClientToProvider(publicClient);

  expect(provider.network.chainId).toEqual(publicClient.chain.id);
  expect(provider.network.name).toEqual(publicClient.chain.name);

  expect(provider.connection.url).toEqual('https://sepolia-rollup.arbitrum.io/rpc');
});

it(`successfully converts PublicClient to Provider (custom Transport)`, () => {
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http('https://arbitrum-sepolia.gateway.tenderly.co'),
  });

  const provider = publicClientToProvider(publicClient);

  expect(provider.network.chainId).toEqual(publicClient.chain.id);
  expect(provider.network.name).toEqual(publicClient.chain.name);

  expect(provider.connection.url).toEqual('https://arbitrum-sepolia.gateway.tenderly.co');
});
