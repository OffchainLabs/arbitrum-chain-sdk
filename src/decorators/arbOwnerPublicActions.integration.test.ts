import { it, expect } from 'vitest';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { nitroTestnodeL2 } from '../chains';
import { arbOwnerPublicActions } from './arbOwnerPublicActions';
import { getNitroTestnodePrivateKeyAccounts, nitroTestnodePollingInterval } from '../testHelpers';

// l2 owner private key
const devPrivateKey = getNitroTestnodePrivateKeyAccounts().l2RollupOwner.privateKey;

const owner = privateKeyToAccount(devPrivateKey);
const randomAccount = privateKeyToAccount(generatePrivateKey());

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
  pollingInterval: nitroTestnodePollingInterval,
}).extend(arbOwnerPublicActions);

it('successfully fetches network fee receiver', async () => {
  const result = await client.arbOwnerReadContract({
    functionName: 'getNetworkFeeAccount',
  });

  expect(result).toEqual(owner.address);
});

it('succesfully fetches chain owners', async () => {
  const result = await client.arbOwnerReadContract({
    functionName: 'getAllChainOwners',
  });

  expect(result).toContain(owner.address);
});

it('succesfully adds chain owner', async () => {
  const isOwnerInitially = await client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is not already an owner
  expect(isOwnerInitially).toEqual(false);

  const transactionRequest = await client.arbOwnerPrepareTransactionRequest({
    functionName: 'addChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: owner.address,
  });

  // submit tx to add chain owner
  const txHash = await client.sendRawTransaction({
    serializedTransaction: await owner.signTransaction(transactionRequest),
  });

  await client.waitForTransactionReceipt({ hash: txHash });

  const isOwner = await client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is now owner
  expect(isOwner).toEqual(true);
});

it('succesfully removes chain owner', async () => {
  const isOwnerInitially = await client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is an owner
  expect(isOwnerInitially).toEqual(true);

  const transactionRequest = await client.arbOwnerPrepareTransactionRequest({
    functionName: 'removeChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: owner.address,
  });

  // submit tx to remove chain owner
  const txHash = await client.sendRawTransaction({
    serializedTransaction: await owner.signTransaction(transactionRequest),
  });

  await client.waitForTransactionReceipt({ hash: txHash });

  const isOwner = await client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  // assert account is no longer chain owner
  expect(isOwner).toEqual(false);
});

it('succesfully updates infra fee receiver', async () => {
  const initialInfraFeeReceiver = await client.arbOwnerReadContract({
    functionName: 'getInfraFeeAccount',
  });

  // assert account is not already infra fee receiver
  expect(initialInfraFeeReceiver).not.toEqual(randomAccount.address);

  const transactionRequest = await client.arbOwnerPrepareTransactionRequest({
    functionName: 'setInfraFeeAccount',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: owner.address,
  });

  // submit tx to update infra fee receiver
  const txHash = await client.sendRawTransaction({
    serializedTransaction: await owner.signTransaction(transactionRequest),
  });

  await client.waitForTransactionReceipt({ hash: txHash });

  const infraFeeReceiver = await client.arbOwnerReadContract({
    functionName: 'getInfraFeeAccount',
  });

  // assert account is now infra fee receiver
  expect(infraFeeReceiver).toEqual(randomAccount.address);
});
