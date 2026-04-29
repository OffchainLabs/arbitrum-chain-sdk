import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

import { getClientVersion } from './getClientVersion';

const arbitrumSepoliaPublicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

it('fetches client version with public client', async () => {
  const clientVersion = await getClientVersion(arbitrumSepoliaPublicClient);
  expect(clientVersion.startsWith('nitro/')).toBeTruthy();
});

it('fetches client version with rpc url', async () => {
  const clientVersion = await getClientVersion('https://sepolia-rollup.arbitrum.io/rpc');
  expect(clientVersion.startsWith('nitro/')).toBeTruthy();
});
