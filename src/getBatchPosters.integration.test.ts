import { describe, it, expect } from 'vitest';
import { Address, createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from './chains';
import { sequencerInboxActions } from './decorators/sequencerInboxActions';
import { getInformationFromTestnode, getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { getBatchPosters } from './getBatchPosters';

const { l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();
const { l3Rollup, l3UpgradeExecutor, l3SequencerInbox } = getInformationFromTestnode();

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
}).extend(
  sequencerInboxActions({
    sequencerInbox: l3SequencerInbox,
  }),
);

async function setBatchPoster(batchPoster: Address, state: boolean) {
  const tx = await client.sequencerInboxPrepareTransactionRequest({
    functionName: 'setIsBatchPoster',
    args: [batchPoster, state],
    account: l3RollupOwner.address,
    upgradeExecutor: l3UpgradeExecutor,
    sequencerInbox: l3SequencerInbox,
  });

  const txHash = await client.sendRawTransaction({
    serializedTransaction: await l3RollupOwner.signTransaction(tx),
  });

  await client.waitForTransactionReceipt({
    hash: txHash,
  });
}

// Tests can be enabled once we run one node per integration test
describe('successfully get batch posters', () => {
  it('when disabling the same batch posters multiple time', async () => {
    const randomAccount = privateKeyToAccount(generatePrivateKey()).address;

    const { isAccurate: isAccurateInitially, batchPosters: initialBatchPosters } =
      await getBatchPosters(client, {
        rollup: l3Rollup,
        sequencerInbox: l3SequencerInbox,
      });

    // By default, chains from nitro testnode has 1 batch poster
    expect(initialBatchPosters).toHaveLength(1);
    expect(isAccurateInitially).toBeTruthy();

    await setBatchPoster(randomAccount, false);
    await setBatchPoster(randomAccount, false);

    const { isAccurate: isStillAccurate, batchPosters: newBatchPosters } = await getBatchPosters(
      client,
      {
        rollup: l3Rollup,
        sequencerInbox: l3SequencerInbox,
      },
    );
    // Setting the same batch poster multiple time to false doesn't add new batch posters
    expect(newBatchPosters).toEqual(initialBatchPosters);
    expect(isStillAccurate).toBeTruthy();

    await setBatchPoster(randomAccount, true);
    const { batchPosters, isAccurate } = await getBatchPosters(client, {
      rollup: l3Rollup,
      sequencerInbox: l3SequencerInbox,
    });

    expect(batchPosters).toEqual(initialBatchPosters.concat(randomAccount));
    expect(isAccurate).toBeTruthy();

    // Reset state for future tests
    await setBatchPoster(randomAccount, false);
    const { isAccurate: isAccurateFinal, batchPosters: batchPostersFinal } = await getBatchPosters(
      client,
      {
        rollup: l3Rollup,
        sequencerInbox: l3SequencerInbox,
      },
    );
    expect(batchPostersFinal).toEqual(initialBatchPosters);
    expect(isAccurateFinal).toBeTruthy();
  });

  it('when enabling the same batch poster multiple time', async () => {
    const randomAccount = privateKeyToAccount(generatePrivateKey()).address;

    const { isAccurate: isAccurateInitially, batchPosters: initialBatchPosters } =
      await getBatchPosters(client, {
        rollup: l3Rollup,
        sequencerInbox: l3SequencerInbox,
      });
    // By default, chains from nitro testnode has 1 batch poster
    expect(initialBatchPosters).toHaveLength(1);
    expect(isAccurateInitially).toBeTruthy();

    await setBatchPoster(randomAccount, true);
    await setBatchPoster(randomAccount, true);
    const { isAccurate: isStillAccurate, batchPosters: newBatchPosters } = await getBatchPosters(
      client,
      {
        rollup: l3Rollup,
        sequencerInbox: l3SequencerInbox,
      },
    );

    expect(newBatchPosters).toEqual(initialBatchPosters.concat(randomAccount));
    expect(isStillAccurate).toBeTruthy();

    // Reset state for futures tests
    await setBatchPoster(randomAccount, false);
    const { batchPosters, isAccurate } = await getBatchPosters(client, {
      rollup: l3Rollup,
      sequencerInbox: l3SequencerInbox,
    });
    expect(batchPosters).toEqual(initialBatchPosters);
    expect(isAccurate).toBeTruthy();
  });

  it('when adding an existing batch poster', async () => {
    const { isAccurate: isAccurateInitially, batchPosters: initialBatchPosters } =
      await getBatchPosters(client, { rollup: l3Rollup, sequencerInbox: l3SequencerInbox });
    expect(initialBatchPosters).toHaveLength(1);
    expect(isAccurateInitially).toBeTruthy();

    const firstBatchPoster = initialBatchPosters[0];
    await setBatchPoster(firstBatchPoster, true);

    const { isAccurate, batchPosters } = await getBatchPosters(client, {
      rollup: l3Rollup,
      sequencerInbox: l3SequencerInbox,
    });
    expect(batchPosters).toEqual(initialBatchPosters);
    expect(isAccurate).toBeTruthy();
  });

  it('when removing an existing batch poster', async () => {
    const { isAccurate: isAccurateInitially, batchPosters: initialBatchPosters } =
      await getBatchPosters(client, { rollup: l3Rollup, sequencerInbox: l3SequencerInbox });
    expect(initialBatchPosters).toHaveLength(1);
    expect(isAccurateInitially).toBeTruthy();

    const lastBatchPoster = initialBatchPosters[initialBatchPosters.length - 1];
    await setBatchPoster(lastBatchPoster, false);
    const { isAccurate, batchPosters } = await getBatchPosters(client, {
      rollup: l3Rollup,
      sequencerInbox: l3SequencerInbox,
    });
    expect(batchPosters).toEqual(initialBatchPosters.slice(0, -1));
    expect(isAccurate).toBeTruthy();

    await setBatchPoster(lastBatchPoster, true);
    const { isAccurate: isAccurateFinal, batchPosters: batchPostersFinal } = await getBatchPosters(
      client,
      { rollup: l3Rollup, sequencerInbox: l3SequencerInbox },
    );
    expect(batchPostersFinal).toEqual(initialBatchPosters);
    expect(isAccurateFinal).toBeTruthy();
  });
});
