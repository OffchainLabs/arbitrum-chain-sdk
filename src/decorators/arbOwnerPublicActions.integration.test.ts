import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import { arbOwnerPublicActions } from './arbOwnerPublicActions';
import { getNitroTestnodePrivateKeyAccounts } from '../testHelpers';
import { getAnvilTestStack, isAnvilTestMode } from '../integrationTestHelpers/injectedMode';
import { PrivateKeyAccount } from 'viem/accounts';

const env = isAnvilTestMode() ? getAnvilTestStack() : undefined;

const randomAccount = privateKeyToAccount(generatePrivateKey());

let l2RollupOwner: PrivateKeyAccount;

if (env) {
  l2RollupOwner = env.l2.accounts.rollupOwner;
} else {
  const devPrivateKey = getNitroTestnodePrivateKeyAccounts().l2RollupOwner.privateKey;
  l2RollupOwner = privateKeyToAccount(devPrivateKey);
}

const l2Client = createPublicClient({
  chain: env ? env.l2.chain : nitroTestnodeL2,
  transport: http(),
}).extend(arbOwnerPublicActions);

it('successfully fetches network fee receiver', async () => {
  const result = await l2Client.arbOwnerReadContract({
    functionName: 'getNetworkFeeAccount',
  });

  expect(result).toEqual(l2RollupOwner.address);
});

it('succesfully fetches chain owners', async () => {
  const result = await l2Client.arbOwnerReadContract({
    functionName: 'getAllChainOwners',
  });

  expect(result).toContain(l2RollupOwner.address);
});

it('succesfully adds chain owner', async () => {
  const isOwnerInitially = await l2Client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is not already an owner
  expect(isOwnerInitially).toEqual(false);

  const transactionRequest = await l2Client.arbOwnerPrepareTransactionRequest({
    functionName: 'addChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: l2RollupOwner.address,
  });

  // submit tx to add chain owner
  const txHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l2RollupOwner.signTransaction(transactionRequest),
  });

  await l2Client.waitForTransactionReceipt({ hash: txHash });

  const isOwner = await l2Client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is now owner
  expect(isOwner).toEqual(true);
});

it('succesfully removes chain owner', async () => {
  const isOwnerInitially = await l2Client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is an owner
  expect(isOwnerInitially).toEqual(true);

  const transactionRequest = await l2Client.arbOwnerPrepareTransactionRequest({
    functionName: 'removeChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: l2RollupOwner.address,
  });

  // submit tx to remove chain owner
  const txHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l2RollupOwner.signTransaction(transactionRequest),
  });

  await l2Client.waitForTransactionReceipt({ hash: txHash });

  const isOwner = await l2Client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is no longer chain owner
  expect(isOwner).toEqual(false);
});

it('succesfully updates infra fee receiver', async () => {
  const initialInfraFeeReceiver = await l2Client.arbOwnerReadContract({
    functionName: 'getInfraFeeAccount',
  });

  // assert account is not already infra fee receiver
  expect(initialInfraFeeReceiver).not.toEqual(randomAccount.address);

  const transactionRequest = await l2Client.arbOwnerPrepareTransactionRequest({
    functionName: 'setInfraFeeAccount',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: l2RollupOwner.address,
  });

  // submit tx to update infra fee receiver
  const txHash = await l2Client.sendRawTransaction({
    serializedTransaction: await l2RollupOwner.signTransaction(transactionRequest),
  });

  await l2Client.waitForTransactionReceipt({ hash: txHash });

  const infraFeeReceiver = await l2Client.arbOwnerReadContract({
    functionName: 'getInfraFeeAccount',
  });

  // assert account is now infra fee receiver
  expect(infraFeeReceiver).toEqual(randomAccount.address);
});
