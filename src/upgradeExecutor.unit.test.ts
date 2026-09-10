import { it, expect, vi } from 'vitest';
import { upgradeExecutorFetchPrivilegedAccounts } from './upgradeExecutorFetchPrivilegedAccounts';
import {
  UPGRADE_EXECUTOR_ROLE_ADMIN,
  UPGRADE_EXECUTOR_ROLE_EXECUTOR,
  upgradeExecutorEncodeFunctionData,
} from './upgradeExecutorEncodeFunctionData';
import { createPublicClient, http } from 'viem';
import { getEarliestRollupCreatorDeploymentBlockNumber } from './utils/getEarliestRollupCreatorDeploymentBlockNumber';
import { arbitrum } from 'viem/chains';

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

// taken from https://arbiscan.io/tx/0xc7e6188415d5572b305219c9b01d773693bc5b07cd1a8ab3e1278107275016e5
it('upgradeExecutorEncodeFunctionData', () => {
  const result = upgradeExecutorEncodeFunctionData({
    functionName: 'execute',
    args: [
      '0x9BF7b8884Fa381a45f8CB2525905fb36C996297a',
      '0x536d8944000000000000000000000000add68bcb0f66878ab9d37a447c7b9067c5dfa94100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000003bd8e2ac65ad6f0f094ba6766cbd9484ab49ef23000000000000000000000000f8e1492255d9428c2fc20a98a1deb1215c8ffefd000000000000000000000000b07dc9103328a51128bc6cc1049d1137035f5e280000000000000000000000003e286452b1c66abb08eb5494c3894f40ab5a59af000000000000000000000000b71ca4ffbb7b58d75ba29891ab45e9dc12b444ed0000000000000000000000008f10e3413586c4a8dcfce19d009872b19e9cd8e3000000000000000000000000566a07c3c932ae6af74d77c29e5c30d8b18537100000000000000000000000005280406912eb8ec677df66c326be48f938dc2e440000000000000000000000000275b3d54a5ddbf8205a75984796efe8b7357bae0000000000000000000000005a1fd562271aac2dadb51baab7760b949d9d81df000000000000000000000000f6b6f07862a02c85628b3a9688beae07fea9c863000000000000000000000000475816ca2a31d601b4e336f5c2418a67978abf09',
    ],
  });

  expect(result).toEqual(
    '0x1cff79cd0000000000000000000000009bf7b8884fa381a45f8cb2525905fb36c996297a00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000204536d8944000000000000000000000000add68bcb0f66878ab9d37a447c7b9067c5dfa94100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000003bd8e2ac65ad6f0f094ba6766cbd9484ab49ef23000000000000000000000000f8e1492255d9428c2fc20a98a1deb1215c8ffefd000000000000000000000000b07dc9103328a51128bc6cc1049d1137035f5e280000000000000000000000003e286452b1c66abb08eb5494c3894f40ab5a59af000000000000000000000000b71ca4ffbb7b58d75ba29891ab45e9dc12b444ed0000000000000000000000008f10e3413586c4a8dcfce19d009872b19e9cd8e3000000000000000000000000566a07c3c932ae6af74d77c29e5c30d8b18537100000000000000000000000005280406912eb8ec677df66c326be48f938dc2e440000000000000000000000000275b3d54a5ddbf8205a75984796efe8b7357bae0000000000000000000000005a1fd562271aac2dadb51baab7760b949d9d81df000000000000000000000000f6b6f07862a02c85628b3a9688beae07fea9c863000000000000000000000000475816ca2a31d601b4e336f5c2418a67978abf0900000000000000000000000000000000000000000000000000000000',
  );
});

// Temporary test with https://arbiscan.io/address/0x0611b78A42903a537BE7a2f9a8783BE39AC63cD9#events
it('it fetches the right privileged accounts from an UpgradeExecutor', async () => {
  const upgradeExecutorAddress = '0x0611b78A42903a537BE7a2f9a8783BE39AC63cD9';
  const chainOwner = '0x46A78349aBA0369D18292a285DE6d5FC5CC2de5c';

  const privilegedAccounts = await upgradeExecutorFetchPrivilegedAccounts({
    upgradeExecutorAddress,
    publicClient,
  });

  expect(Object.keys(privilegedAccounts).length).toEqual(2);
  expect(privilegedAccounts[upgradeExecutorAddress]).toEqual([UPGRADE_EXECUTOR_ROLE_ADMIN]);
  expect(privilegedAccounts[chainOwner]).toEqual([UPGRADE_EXECUTOR_ROLE_EXECUTOR]);
});

it('batches the getLogs queries when the RPC rejects the full range (#642)', async () => {
  const batchingClient = createPublicClient({ chain: arbitrum, transport: http() });

  // keep the batched range tiny and network-free
  const lowerLimit = getEarliestRollupCreatorDeploymentBlockNumber(batchingClient);
  batchingClient.getBlockNumber = vi.fn().mockResolvedValue(lowerLimit + 3n);

  const upgradeExecutorAddress = '0x0611b78A42903a537BE7a2f9a8783BE39AC63cD9';
  const account = '0x46A78349aBA0369D18292a285DE6d5FC5CC2de5c';
  const roleGrantedLog = { args: { role: UPGRADE_EXECUTOR_ROLE_EXECUTOR, account } };

  const getLogsMock = vi.fn();
  batchingClient.getLogs = getLogsMock;
  getLogsMock
    // RoleGranted: full-range rejected, then the batched call returns the event
    .mockRejectedValueOnce(new Error('query range is too big'))
    .mockResolvedValueOnce([roleGrantedLog])
    // RoleRevoked: full-range rejected, then the batched call returns nothing
    .mockRejectedValueOnce(new Error('query range is too big'))
    .mockResolvedValue([]);

  const privilegedAccounts = await upgradeExecutorFetchPrivilegedAccounts({
    upgradeExecutorAddress,
    publicClient: batchingClient,
  });

  // the full-range attempt for each event is retried in batches rather than thrown
  expect(getLogsMock.mock.calls.length).toBeGreaterThanOrEqual(4);
  expect(privilegedAccounts[account]).toEqual([UPGRADE_EXECUTOR_ROLE_EXECUTOR]);
});
