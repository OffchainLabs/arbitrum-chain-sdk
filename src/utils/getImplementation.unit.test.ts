import { it, expect } from 'vitest';
import { createPublicClient, http, zeroAddress } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

import { getImplementation } from './getImplementation';

const arbitrumSepoliaPublicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

it('fetches no implementation address for RollupCreator v1.1.0 on Arbitrum Sepolia', async () => {
  const implementation = await getImplementation({
    client: arbitrumSepoliaPublicClient,
    address: '0x06E341073b2749e0Bb9912461351f716DeCDa9b0',
  });
  expect(implementation).toEqual(zeroAddress);
});

it('fetches implementation address for TokenBridgeCreator v1.2.2 on Arbitrum Sepolia', async () => {
  const implementation = await getImplementation({
    client: arbitrumSepoliaPublicClient,
    address: '0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E',
  });
  expect(implementation).toEqual('0x6b6e01852716f2d7dab6b8729bb50e67be68bf04');
});
