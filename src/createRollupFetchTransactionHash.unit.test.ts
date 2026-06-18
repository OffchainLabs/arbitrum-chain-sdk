import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';

import { arbitrumOne } from './chains';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';

const arbitrumOneClient = createPublicClient({
  chain: arbitrumOne,
  transport: http(),
});

// https://arbiscan.io/tx/0x7b5c9f2ea284581270a3178377dbc9aded97b1f0a786519697b1ef28e3e68fc5 (deployment)
it('should fetch transaction hash for a rollup', async () => {
  const transactionHash = await createRollupFetchTransactionHash({
    rollup: '0xBDC16cccD30ced069Cc9E332D40662D8C476B6cb',
    publicClient: arbitrumOneClient,
  });

  expect(transactionHash).toEqual(
    '0x7b5c9f2ea284581270a3178377dbc9aded97b1f0a786519697b1ef28e3e68fc5',
  );
});

// https://arbiscan.io/tx/0xec0323a06d912b1d5181b6bee270738f2619a54e148e568faff5305b42065755 (upgrade)
// https://arbiscan.io/tx/0x9e6436602dfa942c9b58c67ba56c5526e39efb8adf25fdb6780de24a7831e319 (deployment)
it('should fetch transaction hash for a rollup that was upgraded', async () => {
  const transactionHash = await createRollupFetchTransactionHash({
    rollup: '0xd6e33A7898aE63Cb3D56b4B51575141E953BD9D5',
    publicClient: arbitrumOneClient,
  });

  expect(transactionHash).toEqual(
    '0x9e6436602dfa942c9b58c67ba56c5526e39efb8adf25fdb6780de24a7831e319',
  );
});
