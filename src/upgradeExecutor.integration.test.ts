import { describe, it, expect } from 'vitest';
import { createPublicClient, http, PublicClient } from 'viem';

import { nitroTestnodeL1 } from './chains';
import {
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
  nitroTestnodePollingInterval,
} from './testHelpers';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from './upgradeExecutorPrepareAddExecutorTransactionRequest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';
import { createRollupPrepareTransactionReceipt } from './createRollupPrepareTransactionReceipt';
import { upgradeExecutorFetchPrivilegedAccounts } from './upgradeExecutorFetchPrivilegedAccounts';
import { UPGRADE_EXECUTOR_ROLE_EXECUTOR } from './upgradeExecutorEncodeFunctionData';
import { upgradeExecutorPrepareRemoveExecutorTransactionRequest } from './upgradeExecutorPrepareRemoveExecutorTransactionRequest';

// Generating random account
const randomAccount = privateKeyToAccount(generatePrivateKey());

// Testnode accounts
const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const l2RollupOwner = testnodeAccounts.l2RollupOwner;

const nitroTestnodeL1Client = createPublicClient({
  chain: nitroTestnodeL1,
  transport: http(nitroTestnodeL1.rpcUrls.default.http[0]),
  pollingInterval: nitroTestnodePollingInterval,
});

async function getUpgradeExecutorOfRollup(rollup: `0x${string}`, publicClient: PublicClient) {
  const transactionHash = await createRollupFetchTransactionHash({
    rollup,
    publicClient,
  });
  const transactionReceipt = createRollupPrepareTransactionReceipt(
    await publicClient.getTransactionReceipt({ hash: transactionHash }),
  );
  const coreContracts = transactionReceipt.getCoreContracts();
  return coreContracts.upgradeExecutor;
}

describe('upgradeExecutor role management', () => {
  it(`successfully grants and revokes the executor role to a new account`, async () => {
    const testnodeInformation = getInformationFromTestnode();
    const upgradeExecutor = await getUpgradeExecutorOfRollup(
      testnodeInformation.rollup,
      nitroTestnodeL1Client,
    );

    // prepare the transaction to add the executor role
    const addExecutorTransactionRequest = await upgradeExecutorPrepareAddExecutorTransactionRequest(
      {
        account: randomAccount.address,
        upgradeExecutorAddress: upgradeExecutor,
        executorAccountAddress: l2RollupOwner.address,
        publicClient: nitroTestnodeL1Client,
      },
    );

    // sign and send the transaction
    const addExecutorTransactionHash = await nitroTestnodeL1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(addExecutorTransactionRequest),
    });

    // wait for transaction receipt
    await nitroTestnodeL1Client.waitForTransactionReceipt({ hash: addExecutorTransactionHash });

    // verify that the account has been added to the list of privileged accounts
    const privilegedAccountsAfterAdding = await upgradeExecutorFetchPrivilegedAccounts({
      upgradeExecutorAddress: upgradeExecutor,
      publicClient: nitroTestnodeL1Client,
    });
    expect(privilegedAccountsAfterAdding).toHaveProperty(randomAccount.address);
    expect(privilegedAccountsAfterAdding[randomAccount.address]).toEqual([
      UPGRADE_EXECUTOR_ROLE_EXECUTOR,
    ]);

    // prepare the transaction to remove the executor role
    const removeExecutorTransactionRequest =
      await upgradeExecutorPrepareRemoveExecutorTransactionRequest({
        account: randomAccount.address,
        upgradeExecutorAddress: upgradeExecutor,
        executorAccountAddress: l2RollupOwner.address,
        publicClient: nitroTestnodeL1Client,
      });

    // sign and send the transaction
    const removeExecutorTransactionHash = await nitroTestnodeL1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(removeExecutorTransactionRequest),
    });

    // wait for transaction receipt
    await nitroTestnodeL1Client.waitForTransactionReceipt({ hash: removeExecutorTransactionHash });

    // verify that the account has been removed from the list of privileged accounts
    const privilegedAccountsAfterRemoving = await upgradeExecutorFetchPrivilegedAccounts({
      upgradeExecutorAddress: upgradeExecutor,
      publicClient: nitroTestnodeL1Client,
    });
    expect(privilegedAccountsAfterRemoving).to.not.have.property(randomAccount.address);
  });
});
