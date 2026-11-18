import { describe, expect, it } from 'vitest';
import { createPublicClient } from 'viem';
import { createTestRpcTransport } from '../testRpcTransport';

import { prepareArbitrumNetwork } from './registerNewNetwork';
import { arbitrum } from 'viem/chains';

const client = createPublicClient({
  chain: arbitrum,
  transport: createTestRpcTransport(arbitrum),
});

describe('prepareArbitrumNetwork', () => {
  it(`should create orbit chain network object for custom gas token chain (Xai)`, async () => {
    const network = await prepareArbitrumNetwork(client, {
      rollup: '0xc47dacfbaa80bd9d8112f4e8069482c2a3221336',
      fromBlock: 166_757_506n,
      toBlock: 166_757_506n,
    });
    expect(network).toMatchSnapshot();
  });

  it(`should create orbit chain network object for ETH gas token chain (Proof of Play Apex)`, async () => {
    const network = await prepareArbitrumNetwork(client, {
      rollup: '0x65AD139061B3f6DDb16170a07b925337ddf42407',
      fromBlock: 183_097_524n,
      toBlock: 183_097_524n,
    });
    expect(network).toMatchSnapshot();
  });
});
