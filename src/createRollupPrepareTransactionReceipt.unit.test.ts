import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { sepolia, arbitrumSepolia } from 'viem/chains';

import { createRollupPrepareTransactionReceipt } from './createRollupPrepareTransactionReceipt';

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co'),
});

// https://sepolia.arbiscan.io/tx/0x5b0b49e0259289fc89949a55a5ad35a8939440a55065d29b14e5e7ef7494efff
it('successfully parses core contracts from a tx receipt on RollupCreator v1.1', async () => {
  const txReceipt = await client.getTransactionReceipt({
    hash: '0x5b0b49e0259289fc89949a55a5ad35a8939440a55065d29b14e5e7ef7494efff',
  });
  expect(createRollupPrepareTransactionReceipt(txReceipt).getCoreContracts()).toMatchSnapshot();
});

// https://sepolia.arbiscan.io/tx/0x77db43157182a69ce0e6d2a0564d2dabb43b306d48ea7b4d877160d6a1c9b66d
it('successfully parses core contracts from a tx receipt on RollupCreator v2.1', async () => {
  const txReceipt = await client.getTransactionReceipt({
    hash: '0x77db43157182a69ce0e6d2a0564d2dabb43b306d48ea7b4d877160d6a1c9b66d',
  });
  expect(createRollupPrepareTransactionReceipt(txReceipt).getCoreContracts()).toMatchSnapshot();
});

// https://sepolia.etherscan.io/tx/0x751f1b2bab2806769f663db2141d434e4d8c9b65bc4a5d7ca10ed597f918191f
it('successfully parses core contracts from a tx receipt on RollupCreator v3.1', async () => {
  const txReceipt = await sepoliaClient.getTransactionReceipt({
    hash: '0x751f1b2bab2806769f663db2141d434e4d8c9b65bc4a5d7ca10ed597f918191f',
  });
  expect(createRollupPrepareTransactionReceipt(txReceipt).getCoreContracts()).toMatchSnapshot();
});

// https://sepolia.etherscan.io/tx/0x6f6e67cc36fdee7248d76811739b2b6718641b5b1a13ca39c7605aa0636e7d67
it('successfully parses core contracts from a tx receipt on RollupCreator v3.2', async () => {
  const txReceipt = await sepoliaClient.getTransactionReceipt({
    hash: '0x6f6e67cc36fdee7248d76811739b2b6718641b5b1a13ca39c7605aa0636e7d67',
  });
  expect(createRollupPrepareTransactionReceipt(txReceipt).getCoreContracts()).toMatchSnapshot();
});
