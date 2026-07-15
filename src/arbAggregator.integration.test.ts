import { it, expect, describe } from 'vitest';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from './chains';
import { arbAggregatorConfig } from './contracts/ArbAggregator';
import { arbAggregatorPrepareTransactionRequest } from './arbAggregatorPrepareTransactionRequest';
import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';

const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const l2RollupOwner = testnodeAccounts.l2RollupOwner;
const randomAccount = privateKeyToAccount(generatePrivateKey());

const nitroTestnodeL2Client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
});

describe('ArbAggregator actions', () => {
  it('successfully fetches the batch posters and the fee collectors', async () => {
    const batchPosters = await nitroTestnodeL2Client.readContract({
      ...arbAggregatorConfig,
      functionName: 'getBatchPosters',
    });

    expect(batchPosters).toHaveLength(2);
    expect(batchPosters[0]).toEqual('0xA4b000000000000000000073657175656e636572');

    const batchPosterFeeCollector = await nitroTestnodeL2Client.readContract({
      ...arbAggregatorConfig,
      functionName: 'getFeeCollector',
      args: [batchPosters[0]],
    });

    expect(batchPosterFeeCollector).toEqual('0xA4b000000000000000000073657175656e636572');
  });

  it('succesfully updates the fee collector of a batch poster', async () => {
    // Get the batch posters
    const batchPosters = await nitroTestnodeL2Client.readContract({
      ...arbAggregatorConfig,
      functionName: 'getBatchPosters',
    });

    // Set the fee collector of the batch poster to the random address
    const setFeeCollectorTransactionRequest = await arbAggregatorPrepareTransactionRequest(
      nitroTestnodeL2Client,
      {
        functionName: 'setFeeCollector',
        args: [batchPosters[1], randomAccount.address],
        upgradeExecutor: false,
        account: l2RollupOwner.address,
      },
    );
    const txHash = await nitroTestnodeL2Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(setFeeCollectorTransactionRequest),
    });
    await nitroTestnodeL2Client.waitForTransactionReceipt({ hash: txHash });

    // Check the fee collector has changed
    const batchPosterFeeCollector = await nitroTestnodeL2Client.readContract({
      ...arbAggregatorConfig,
      functionName: 'getFeeCollector',
      args: [batchPosters[1]],
    });
    expect(batchPosterFeeCollector).toEqual(randomAccount.address);
  });
});
