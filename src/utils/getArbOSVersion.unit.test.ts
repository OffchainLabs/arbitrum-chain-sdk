import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { arbitrum as arbitrumOne, sepolia } from 'viem/chains';

import { getArbOSVersion } from './getArbOSVersion';

it('returns the ArbOS version of Arbitrum One', async () => {
  const arbitrumOneClient = createPublicClient({
    chain: arbitrumOne,
    transport: http(),
  });

  expect(await getArbOSVersion(arbitrumOneClient)).toBe(51);
});

it('throws if the chain is not an Arbitrum chain', async () => {
  const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http('https://gateway.tenderly.co/public/sepolia'),
  });

  await expect(getArbOSVersion(sepoliaClient)).rejects.toThrowError();
});
