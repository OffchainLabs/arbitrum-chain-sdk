import { it, expect, describe } from 'vitest';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import { arbAggregatorActions } from './arbAggregatorActions';
import { getNitroTestnodePrivateKeyAccounts } from '../testHelpers';

const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const l2RollupOwner = testnodeAccounts.l2RollupOwner;
const randomAccount = privateKeyToAccount(generatePrivateKey());

const nitroTestnodeL2Client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
}).extend(arbAggregatorActions);

describe('ArgAggregator decorator tests', () => {
  it('successfully fetches the batch posters and the fee collectors', async () => {
    const batchPostersResult = await nitroTestnodeL2Client.arbAggregatorReadContract({
      functionName: 'getBatchPosters',
    });
    if (!Array.isArray(batchPostersResult))
      throw new Error('getBatchPosters must return an address tuple');
    const batchPosters = batchPostersResult as readonly `0x${string}`[];

    expect(batchPosters).toHaveLength(2);
    expect(batchPosters[0]).toEqual('0xA4b000000000000000000073657175656e636572');

    const batchPosterFeeCollector = await nitroTestnodeL2Client.arbAggregatorReadContract({
      functionName: 'getFeeCollector',
      args: [batchPosters[0]],
    });

    expect(batchPosterFeeCollector).toEqual('0xA4b000000000000000000073657175656e636572');
  });

  it('succesfully updates the fee collector of a batch poster', async () => {
    // Get the batch posters
    const batchPostersResult = await nitroTestnodeL2Client.arbAggregatorReadContract({
      functionName: 'getBatchPosters',
    });
    if (!Array.isArray(batchPostersResult))
      throw new Error('getBatchPosters must return an address tuple');
    const batchPosters = batchPostersResult as readonly `0x${string}`[];

    // Set the fee collector of the batch poster to the random address
    const setFeeCollectorTransactionRequest =
      await nitroTestnodeL2Client.arbAggregatorPrepareTransactionRequest({
        functionName: 'setFeeCollector',
        args: [batchPosters[1], randomAccount.address],
        upgradeExecutor: false,
        account: l2RollupOwner.address,
      });
    const txHash = await nitroTestnodeL2Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(setFeeCollectorTransactionRequest),
    });
    await nitroTestnodeL2Client.waitForTransactionReceipt({ hash: txHash });

    // Check the fee collector has changed
    const batchPosterFeeCollector = await nitroTestnodeL2Client.arbAggregatorReadContract({
      functionName: 'getFeeCollector',
      args: [batchPosters[1]],
    });
    expect(batchPosterFeeCollector).toEqual(randomAccount.address);
  });
});
