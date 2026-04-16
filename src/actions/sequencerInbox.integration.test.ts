import { describe, it, expect } from 'vitest';
import {
  createRollupHelper,
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
} from '../testHelpers';
import { Hex, createPublicClient, http, zeroAddress } from 'viem';
import { nitroTestnodeL2 } from '../chains';
import { getMaxTimeVariation } from './getMaxTimeVariation';
import { isBatchPoster } from './isBatchPoster';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
import { isValidKeysetHash } from './isValidKeysetHash';
import { buildSetValidKeyset } from './buildSetValidKeyset';
import { buildSetMaxTimeVariation } from './buildSetMaxTimeVariation';
import { buildDisableBatchPoster, buildEnableBatchPoster } from './buildSetIsBatchPoster';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { buildInvalidateKeysetHash } from './buildInvalidateKeysetHash';

const { l3SequencerInbox, l3BatchPoster, l3UpgradeExecutor } = getInformationFromTestnode();
const { l3TokenBridgeDeployer, deployer, l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
});

describe('max time variation management', () => {
  const defaultMaxTimeVariation = {
    delayBlocks: 5_760n,
    delaySeconds: 86_400n,
    futureBlocks: 12n,
    futureSeconds: 3_600n,
  };
  it('getMaxTimeVariation successfully fetches max time variation', async () => {
    const result = await getMaxTimeVariation(client, {
      sequencerInbox: l3SequencerInbox,
    });
    expect(result).toEqual(defaultMaxTimeVariation);
  });

  it('buildSetMaxTimeVariation successfully set max time varation', async () => {
    async function setMaxTimeVariation(changes: {
      delayBlocks: bigint;
      futureBlocks: bigint;
      delaySeconds: bigint;
      futureSeconds: bigint;
    }) {
      const transactionRequest = await buildSetMaxTimeVariation(client, {
        sequencerInbox: l3SequencerInbox,
        upgradeExecutor: l3UpgradeExecutor,
        account: l3RollupOwner.address,
        params: changes,
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });

      await client.waitForTransactionReceipt({ hash: txHash });
    }

    const changes = {
      delayBlocks: 2_880n,
      futureBlocks: 6n,
      delaySeconds: 43_200n,
      futureSeconds: 1_800n,
    };
    await setMaxTimeVariation(changes);
    const newResult = await getMaxTimeVariation(client, {
      sequencerInbox: l3SequencerInbox,
    });
    expect(newResult).toEqual(changes);

    await setMaxTimeVariation(defaultMaxTimeVariation);
    const finalResult = await getMaxTimeVariation(client, {
      sequencerInbox: l3SequencerInbox,
    });
    expect(finalResult).toEqual(defaultMaxTimeVariation);
  });
});

describe('batch poster management', () => {
  it('isBatchPoster successfully fetches whether or an address is a batch poster', async () => {
    const isNotBatchPosterAddress = await isBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      params: {
        batchPoster: zeroAddress,
      },
    });
    expect(isNotBatchPosterAddress).toBeFalsy();
    const isBatchPosterAddress = await isBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      params: {
        batchPoster: l3BatchPoster,
      },
    });
    expect(isBatchPosterAddress).toBeTruthy();
  });

  it('successfully enable or disable an address as batch poster', async () => {
    const randomAddress = privateKeyToAccount(generatePrivateKey()).address;
    const isRandomAddressBatchPoster = await isBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      params: {
        batchPoster: randomAddress,
      },
    });
    expect(isRandomAddressBatchPoster).toBeFalsy();

    const enableTransactionRequest = await buildEnableBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      upgradeExecutor: l3UpgradeExecutor,
      account: l3RollupOwner.address,
      params: {
        batchPoster: randomAddress,
      },
    });
    const enableTxHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(enableTransactionRequest),
    });
    await client.waitForTransactionReceipt({ hash: enableTxHash });
    const isRandomAddressBatchPosterAfterEnabling = await isBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      params: {
        batchPoster: randomAddress,
      },
    });
    expect(isRandomAddressBatchPosterAfterEnabling).toBeTruthy();

    const disableTransactionRequest = await buildDisableBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      upgradeExecutor: l3UpgradeExecutor,
      account: l3RollupOwner.address,
      params: {
        batchPoster: randomAddress,
      },
    });
    const disableTxHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(disableTransactionRequest),
    });
    await client.waitForTransactionReceipt({ hash: disableTxHash });
    const isRandomAddressBatchPosterAfterDisabling = await isBatchPoster(client, {
      sequencerInbox: l3SequencerInbox,
      params: {
        batchPoster: randomAddress,
      },
    });
    expect(isRandomAddressBatchPosterAfterDisabling).toBeFalsy();
  });
});

describe('keyset management', () => {
  const keysetBytes =
    '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000002560000000000000002000000000000000201216006dcb5e56764bb72e6a45e6deb301ca85d8c4315c1da2efa29927f2ac8fb25571ce31d2d603735fe03196f6d56bcbf9a1999a89a74d5369822c4445d676c15ed52e5008daa775dc9a839c99ff963a19946ac740579874dac4f639907ae1bc69f0c6694955b524d718ca445831c5375393773401f33725a79661379dddabd5fff28619dc070befd9ed73d699e5c236c1a163be58ba81002b6130709bc064af5d7ba947130b72056bf17263800f1a3ab2269c6a510ef8e7412fd56d1ef1b916a1306e3b1d9c82c099371bd9861582acaada3a16e9dfee5d0ebce61096598a82f112d0a935e8cab5c48d82e3104b0c7ba79157dad1a019a3e7f6ad077b8e6308b116fec0f58239622463c3631fa01e2b4272409215b8009422c16715dbede5909060121600835f995f2478f24892d050daa289f8b6b9c1b185bcd28532f88d610c2642a2dc6f3509740236d33c3e2d9136aab17f819c8c671293bba277717762e8d1c1f7bac9e17dd28d2939a959bb38e500f9c11c38cebbc426e2dea97c40175a655d17400ae6c75ff49e884c79469249e70953258854b64fa8445c585ad45dc6dc6975501c6af7cff7074202c687f8a7bf1a3ac192689755f232275b4c8421b1a5669e9b904c29a292cdf961b783a7c0b4ce736900de4d8c63c5f85a65cb44af34bef840acef84ab75f44c4c9137610b68107aff3bbdcc19119c7a927c115b7b9bfb27d85c500ee77d13ec5a97a3ae6bf51d3b70a5502e8416de7b5eb8e9feee376411ca35c8a7f3f597c7606578cf96a4715ce5a35cf48e39c0a1faa2dee22d74e681900000000000000000000';
  async function deployAnyTrustChainWithKeyset(keyset: Hex) {
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
    const transactionRequest = await buildSetValidKeyset(client, {
      sequencerInbox: sequencerInbox,
      account: l3TokenBridgeDeployer.address,
      upgradeExecutor,
      params: {
        keyset,
      },
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

    const keysetHash = logs.find((log) => log.args.keysetBytes === keyset)?.args.keysetHash;

    return {
      keysetHash,
      sequencerInbox,
      upgradeExecutor,
    };
  }

  it('isValidKeysetHash successfully fetches whether a hash is a valid keyset hash', async () => {
    const invalidKeysetHash = await isValidKeysetHash(client, {
      sequencerInbox: l3SequencerInbox,
      params: {
        keysetHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    });
    expect(invalidKeysetHash).toBeFalsy();

    const { sequencerInbox, keysetHash } = await deployAnyTrustChainWithKeyset(keysetBytes);

    const result = await isValidKeysetHash(client, {
      sequencerInbox,
      params: {
        keysetHash: keysetHash!,
      },
    });
    expect(result).toBeTruthy();
  });

  it('successfully invalidate a keyset hash', async () => {
    const { sequencerInbox, keysetHash, upgradeExecutor } = await deployAnyTrustChainWithKeyset(
      keysetBytes,
    );

    const result = await isValidKeysetHash(client, {
      sequencerInbox,
      params: {
        keysetHash: keysetHash!,
      },
    });
    expect(result).toBeTruthy();

    const transactionRequest = await buildInvalidateKeysetHash(client, {
      sequencerInbox,
      account: l3TokenBridgeDeployer.address,
      upgradeExecutor,
      params: {
        keysetHash: keysetHash!,
      },
    });
    const txHash = await client.sendRawTransaction({
      serializedTransaction: await l3TokenBridgeDeployer.signTransaction(transactionRequest),
    });
    await client.waitForTransactionReceipt({ hash: txHash });

    const resultAfterChange = await isValidKeysetHash(client, {
      sequencerInbox,
      params: {
        keysetHash: keysetHash!,
      },
    });
    expect(resultAfterChange).toBeFalsy();
  });
});
