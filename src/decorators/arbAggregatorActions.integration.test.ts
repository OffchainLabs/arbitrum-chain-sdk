import { it, expect, describe } from 'vitest';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import { arbAggregatorActions } from './arbAggregatorActions';
import { getNitroTestnodePrivateKeyAccounts } from '../testHelpers';
import { getAnvilTestStack, isAnvilTestMode } from '../integrationTestHelpers/injectedMode';

const env = isAnvilTestMode() ? getAnvilTestStack() : undefined;

const l2Client = createPublicClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: http(),
}).extend(arbAggregatorActions);

const l2RollupOwner = env
  ? env.l2.accounts.deployer
  : getNitroTestnodePrivateKeyAccounts().l2RollupOwner;
const randomAccount = privateKeyToAccount(generatePrivateKey());

describe('ArgAggregator decorator tests', () => {
  it('successfully fetches the batch posters and the fee collectors', async () => {
    const batchPosters = await l2Client.arbAggregatorReadContract({
      functionName: 'getBatchPosters',
    });

    expect(batchPosters).toHaveLength(2);
    expect(batchPosters[0]).toEqual('0xA4b000000000000000000073657175656e636572');

    const batchPosterFeeCollector = await l2Client.arbAggregatorReadContract({
      functionName: 'getFeeCollector',
      args: [batchPosters[0]],
    });

    expect(batchPosterFeeCollector).toEqual('0xA4b000000000000000000073657175656e636572');
  });

  it('succesfully updates the fee collector of a batch poster', async () => {
    // Get the batch posters
    const batchPosters = await l2Client.arbAggregatorReadContract({
      functionName: 'getBatchPosters',
    });

    // Set the fee collector of the batch poster to the random address
    const setFeeCollectorTransactionRequest = await l2Client.arbAggregatorPrepareTransactionRequest(
      {
        functionName: 'setFeeCollector',
        args: [batchPosters[1], randomAccount.address],
        upgradeExecutor: false,
        account: l2RollupOwner.address,
      },
    );
    const txHash = await l2Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(setFeeCollectorTransactionRequest),
    });
    await l2Client.waitForTransactionReceipt({ hash: txHash });

    // Check the fee collector has changed
    const batchPosterFeeCollector = await l2Client.arbAggregatorReadContract({
      functionName: 'getFeeCollector',
      args: [batchPosters[1]],
    });
    expect(batchPosterFeeCollector).toEqual(randomAccount.address);
  });
});
