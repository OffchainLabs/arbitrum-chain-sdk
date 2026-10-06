import { it, expect } from 'vitest';
import { createPublicClient } from 'viem';
import { arbitrum as arbitrumOne, sepolia } from 'viem/chains';
import { createTestRpcTransport } from '../testRpcTransport';

import { getArbOSVersion } from './getArbOSVersion';

it('returns the ArbOS version of Arbitrum One', async () => {
  const arbitrumOneClient = createPublicClient({
    chain: arbitrumOne,
    transport: createTestRpcTransport(arbitrumOne),
  });

  expect(await getArbOSVersion(arbitrumOneClient)).toBe(61);
});

it('throws if the chain is not an Arbitrum chain', async () => {
  const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: createTestRpcTransport(sepolia),
  });

  await expect(getArbOSVersion(sepoliaClient)).rejects.toThrowError();
});
