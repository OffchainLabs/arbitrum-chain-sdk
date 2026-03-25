import { describe, it, expect } from 'vitest';
import { Address, createPublicClient, http, PublicClient } from 'viem';

import { nitroTestnodeL1 } from './chains';
import {
  getInformationFromTestnode,
  getNitroTestnodePrivateKeyAccounts,
  PrivateKeyAccountWithPrivateKey,
} from './testHelpers';
import { upgradeExecutorPrepareAddExecutorTransactionRequest } from './upgradeExecutorPrepareAddExecutorTransactionRequest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';
import { createRollupPrepareTransactionReceipt } from './createRollupPrepareTransactionReceipt';
import { upgradeExecutorFetchPrivilegedAccounts } from './upgradeExecutorFetchPrivilegedAccounts';
import { UPGRADE_EXECUTOR_ROLE_EXECUTOR } from './upgradeExecutorEncodeFunctionData';
import { upgradeExecutorPrepareRemoveExecutorTransactionRequest } from './upgradeExecutorPrepareRemoveExecutorTransactionRequest';
import { isAnvilTestMode, getAnvilTestStack } from './integrationTestHelpers/injectedMode';

const env = isAnvilTestMode() ? getAnvilTestStack() : undefined;

// Generating random account
const randomAccount = privateKeyToAccount(generatePrivateKey());

let l2RollupOwner: PrivateKeyAccountWithPrivateKey;

if (env) {
  l2RollupOwner = env.l2.accounts.rollupOwner;
} else {
  const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
  l2RollupOwner = testnodeAccounts.l2RollupOwner;
}

const l1Client = createPublicClient({
  chain: env ? env.l1.chain : nitroTestnodeL1,
  transport: env ? http() : http(nitroTestnodeL1.rpcUrls.default.http[0]),
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
    let upgradeExecutor: Address;

    if (env) {
      upgradeExecutor = env.l2.upgradeExecutor;
    } else {
      const testnodeInformation = getInformationFromTestnode();
      upgradeExecutor = await getUpgradeExecutorOfRollup(testnodeInformation.rollup, l1Client);
    }

    // prepare the transaction to add the executor role
    const addExecutorTransactionRequest = await upgradeExecutorPrepareAddExecutorTransactionRequest(
      {
        account: randomAccount.address,
        upgradeExecutorAddress: upgradeExecutor,
        executorAccountAddress: l2RollupOwner.address,
        publicClient: l1Client,
      },
    );

    // sign and send the transaction
    const addExecutorTransactionHash = await l1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(addExecutorTransactionRequest),
    });

    // wait for transaction receipt
    await l1Client.waitForTransactionReceipt({ hash: addExecutorTransactionHash });

    // verify that the account has been added to the list of privileged accounts
    const privilegedAccountsAfterAdding = await upgradeExecutorFetchPrivilegedAccounts({
      upgradeExecutorAddress: upgradeExecutor,
      publicClient: l1Client,
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
        publicClient: l1Client,
      });

    // sign and send the transaction
    const removeExecutorTransactionHash = await l1Client.sendRawTransaction({
      serializedTransaction: await l2RollupOwner.signTransaction(removeExecutorTransactionRequest),
    });

    // wait for transaction receipt
    await l1Client.waitForTransactionReceipt({ hash: removeExecutorTransactionHash });

    // verify that the account has been removed from the list of privileged accounts
    const privilegedAccountsAfterRemoving = await upgradeExecutorFetchPrivilegedAccounts({
      upgradeExecutorAddress: upgradeExecutor,
      publicClient: l1Client,
    });
    expect(privilegedAccountsAfterRemoving).to.not.have.property(randomAccount.address);
  });
});
