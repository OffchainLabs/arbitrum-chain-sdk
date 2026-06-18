import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

import { getBridgeUiConfig } from './getBridgeUiConfig';

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co'),
});

// https://sepolia.etherscan.io/tx/0xc172278b80251a7368409b5358fbf7e6250c1afc9a262e38ca15e1ba2bb9a7a8
it('successfully generates bridge UI config from deployment transaction', async () => {
  const bridgeUiConfig = await getBridgeUiConfig({
    params: {
      parentChain: sepolia,
      deploymentTxHash: '0xc172278b80251a7368409b5358fbf7e6250c1afc9a262e38ca15e1ba2bb9a7a8',
    },
    parentChainPublicClient: sepoliaClient,
  });

  expect(bridgeUiConfig).toMatchSnapshot();
});
