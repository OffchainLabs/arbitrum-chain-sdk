import { describe, it, expect } from 'vitest';
import { createPublicClient, http, zeroAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import {
  getNitroTestnodePrivateKeyAccounts,
  getInformationFromTestnode,
  createRollupHelper,
} from '../testHelpers';
import { sequencerInboxActions } from './sequencerInboxActions';
import { sequencerInboxABI } from '../contracts/SequencerInbox';

const { l3RollupOwner, l3TokenBridgeDeployer, deployer } = getNitroTestnodePrivateKeyAccounts();

const randomAccount = privateKeyToAccount(generatePrivateKey());

const { l3SequencerInbox, l3Bridge, l3Rollup, l3BatchPoster, l3UpgradeExecutor } =
  getInformationFromTestnode();

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
}).extend(sequencerInboxActions({ sequencerInbox: l3SequencerInbox }));

describe('sequencerInboxReadContract', () => {
  it('successfully fetches batchCount', async () => {
    const batchCount = await client.sequencerInboxReadContract({
      functionName: 'batchCount',
    });
    expect(Number(batchCount)).greaterThan(0);
  });

  it('successfully fetches bridge', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'bridge',
      sequencerInbox: l3SequencerInbox,
    });

    if (typeof result !== 'string') throw new Error('bridge must return an address string');
    expect(result.toLowerCase()).toEqual(l3Bridge.toLowerCase());
  });

  it('successfully fetches dasKeySetInfo', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'dasKeySetInfo',
      sequencerInbox: l3SequencerInbox,
      args: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
    });

    if (!Array.isArray(result))
      throw new Error('dasKeySetInfo must return [isValidKeyset, creationBlock]');
    const [isValidKeyset, creationBlock] = result;
    expect(isValidKeyset).toEqual(false);
    expect(creationBlock).toEqual(0n);
  });

  it('successfully call inboxAccs', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'inboxAccs',
      sequencerInbox: l3SequencerInbox,
      args: [0n],
    });

    expect(result).not.toEqual(zeroAddress);
  });

  it('successfully call isBatchPoster', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'isBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [randomAccount.address],
    });
    const resultWithBatchPoster = await client.sequencerInboxReadContract({
      functionName: 'isBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [l3BatchPoster],
    });

    expect(result).toEqual(false);
    expect(resultWithBatchPoster).toEqual(true);
  });

  it('successfully call isValidKeysetHash', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'isValidKeysetHash',
      sequencerInbox: l3SequencerInbox,
      args: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
    });

    expect(result).toEqual(false);
  });

  it('successfully call maxTimeVariation', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'maxTimeVariation',
      sequencerInbox: l3SequencerInbox,
    });

    expect(result).toEqual([5760n, 12n, 86400n, 3600n]);
  });

  it('successfully call rollup', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'rollup',
      sequencerInbox: l3SequencerInbox,
    });

    if (typeof result !== 'string') throw new Error('rollup must return an address string');
    expect(result.toLowerCase()).toEqual(l3Rollup.toLowerCase());
  });

  it('successfully call totalDelayedMessagesRead', async () => {
    const result = await client.sequencerInboxReadContract({
      functionName: 'totalDelayedMessagesRead',
      sequencerInbox: l3SequencerInbox,
    });

    expect(Number(result)).greaterThan(0);
  });
});

describe('sequencerInboxPrepareTransactionRequest', () => {
  it('successfully call setValidKeyset', async () => {
    // Keyset needs to be set on anytrust chain
    const batchPosters = [deployer.address];
    const validators = [deployer.address];

    const { createRollupInformation } = await createRollupHelper({
      deployer: l3TokenBridgeDeployer,
      batchPosters,
      validators,
      nativeToken: zeroAddress,
      client,
    });

    const { sequencerInbox, upgradeExecutor } = createRollupInformation.coreContracts;

    const keyset =
      '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000002560000000000000002000000000000000201216006dcb5e56764bb72e6a45e6deb301ca85d8c4315c1da2efa29927f2ac8fb25571ce31d2d603735fe03196f6d56bcbf9a1999a89a74d5369822c4445d676c15ed52e5008daa775dc9a839c99ff963a19946ac740579874dac4f639907ae1bc69f0c6694955b524d718ca445831c5375393773401f33725a79661379dddabd5fff28619dc070befd9ed73d699e5c236c1a163be58ba81002b6130709bc064af5d7ba947130b72056bf17263800f1a3ab2269c6a510ef8e7412fd56d1ef1b916a1306e3b1d9c82c099371bd9861582acaada3a16e9dfee5d0ebce61096598a82f112d0a935e8cab5c48d82e3104b0c7ba79157dad1a019a3e7f6ad077b8e6308b116fec0f58239622463c3631fa01e2b4272409215b8009422c16715dbede5909060121600835f995f2478f24892d050daa289f8b6b9c1b185bcd28532f88d610c2642a2dc6f3509740236d33c3e2d9136aab17f819c8c671293bba277717762e8d1c1f7bac9e17dd28d2939a959bb38e500f9c11c38cebbc426e2dea97c40175a655d17400ae6c75ff49e884c79469249e70953258854b64fa8445c585ad45dc6dc6975501c6af7cff7074202c687f8a7bf1a3ac192689755f232275b4c8421b1a5669e9b904c29a292cdf961b783a7c0b4ce736900de4d8c63c5f85a65cb44af34bef840acef84ab75f44c4c9137610b68107aff3bbdcc19119c7a927c115b7b9bfb27d85c500ee77d13ec5a97a3ae6bf51d3b70a5502e8416de7b5eb8e9feee376411ca35c8a7f3f597c7606578cf96a4715ce5a35cf48e39c0a1faa2dee22d74e681900000000000000000000';
    const transactionRequest = await client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setValidKeyset',
      sequencerInbox: sequencerInbox,
      args: [keyset],
      account: l3TokenBridgeDeployer.address,
      upgradeExecutor: upgradeExecutor,
    });
    const transactionHash = await client.sendRawTransaction({
      serializedTransaction: await l3TokenBridgeDeployer.signTransaction(transactionRequest),
    });

    await client.waitForTransactionReceipt({ hash: transactionHash });
    const logs = await client.getContractEvents({
      address: sequencerInbox,
      abi: sequencerInboxABI,
      eventName: 'SetValidKeyset',
    });
    const keysetHash = logs[0].args.keysetHash;

    const result = await client.sequencerInboxReadContract({
      functionName: 'isValidKeysetHash',
      sequencerInbox,
      args: [keysetHash!],
    });

    expect(result).toEqual(true);
  });

  it('successfully call setIsBatchPoster', async () => {
    const resultBefore = await client.sequencerInboxReadContract({
      functionName: 'isBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [randomAccount.address],
    });
    expect(resultBefore).toEqual(false);

    const transactionRequest = await client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setIsBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [randomAccount.address, true],
      account: l3RollupOwner.address,
      upgradeExecutor: l3UpgradeExecutor,
    });

    const txHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
    });

    await client.waitForTransactionReceipt({ hash: txHash });

    const result = await client.sequencerInboxReadContract({
      functionName: 'isBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [randomAccount.address],
    });
    expect(result).toEqual(true);

    // Revert the change and assert
    const revertTransactionRequest = await client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setIsBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [randomAccount.address, false],
      account: l3RollupOwner.address,
      upgradeExecutor: l3UpgradeExecutor,
    });
    const revertTxHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(revertTransactionRequest),
    });

    await client.waitForTransactionReceipt({ hash: revertTxHash });

    const resultAfterReverting = await client.sequencerInboxReadContract({
      functionName: 'isBatchPoster',
      sequencerInbox: l3SequencerInbox,
      args: [randomAccount.address],
    });
    expect(resultAfterReverting).toEqual(false);
  });

  it('successfully call setMaxTimeVariation', async () => {
    const resultBefore = await client.sequencerInboxReadContract({
      functionName: 'maxTimeVariation',
      sequencerInbox: l3SequencerInbox,
    });

    const transactionRequest = await client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setMaxTimeVariation',
      sequencerInbox: l3SequencerInbox,
      upgradeExecutor: l3UpgradeExecutor,
      args: [
        {
          delayBlocks: 2_880n,
          futureBlocks: 6n,
          delaySeconds: 43_200n,
          futureSeconds: 1_800n,
        },
      ],
      account: l3RollupOwner.address,
    });
    const txHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
    });

    await client.waitForTransactionReceipt({ hash: txHash });

    const result = await client.sequencerInboxReadContract({
      functionName: 'maxTimeVariation',
      sequencerInbox: l3SequencerInbox,
    });
    expect(result).toEqual([2_880n, 6n, 43_200n, 1_800n]);

    // Revert the change, so read test still work
    if (!Array.isArray(resultBefore)) throw new Error('maxTimeVariation must return a tuple');
    const transactionRequestRevert = await client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setMaxTimeVariation',
      sequencerInbox: l3SequencerInbox,
      upgradeExecutor: l3UpgradeExecutor,
      args: [
        {
          delayBlocks: resultBefore[0],
          futureBlocks: resultBefore[1],
          delaySeconds: resultBefore[2],
          futureSeconds: resultBefore[3],
        },
      ],
      account: l3RollupOwner.address,
    });
    const revertTxHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(transactionRequestRevert),
    });

    await client.waitForTransactionReceipt({ hash: revertTxHash });
  });
});
