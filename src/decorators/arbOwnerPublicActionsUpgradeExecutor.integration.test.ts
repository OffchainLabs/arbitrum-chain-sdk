import { it, expect } from 'vitest';
import { Address, createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { nitroTestnodeL3 } from '../chains';
import { arbOwnerPublicActions } from './arbOwnerPublicActions';
import { arbGasInfoPublicActions } from './arbGasInfoPublicActions';
import { getNitroTestnodePrivateKeyAccounts } from '../testHelpers';

// L3 Owner Private Key
const devPrivateKey = getNitroTestnodePrivateKeyAccounts().l3RollupOwner.privateKey;

// L3 Upgrade Executor Address
const upgradeExecutorAddress: Address = '0x24198F8A339cd3C47AEa3A764A20d2dDaB4D1b5b';

const owner = privateKeyToAccount(devPrivateKey);
const randomAccount = privateKeyToAccount(generatePrivateKey());

// Client for arb owner public actions
const client = createPublicClient({
  chain: nitroTestnodeL3,
  transport: http(),
})
  .extend(arbOwnerPublicActions)
  .extend(arbGasInfoPublicActions);

it('succesfully adds chain owner using upgrade executor', async () => {
  // Checks if random address is not a chain owner yet
  const isOwnerInitially = await client.arbOwnerReadContract({
    functionName: 'isChainOwner',
    args: [randomAccount.address],
  });

  expect(isOwnerInitially).toEqual(false);

  // Adding random address as chain owner using upgrade executor
  const transactionRequest = await client.arbOwnerPrepareTransactionRequest({
    functionName: 'addChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: upgradeExecutorAddress,
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
    upgradeExecutor: upgradeExecutorAddress,
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

it('successfully updates infra fee receiver', async () => {
  const initialInfraFeeReceiver = await client.arbOwnerReadContract({
    functionName: 'getInfraFeeAccount',
  });

  // assert account is not already infra fee receiver
  expect(initialInfraFeeReceiver).not.toEqual(randomAccount.address);

  const transactionRequest = await client.arbOwnerPrepareTransactionRequest({
    functionName: 'setInfraFeeAccount',
    args: [randomAccount.address],
    upgradeExecutor: upgradeExecutorAddress,
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

it('successfully updates L2 Base Fee Estimate Inertia on Orbit chain', async () => {
  const l2BaseFeeEstimateInertia = BigInt(9);
  const transactionRequest = await client.arbOwnerPrepareTransactionRequest({
    functionName: 'setL1BaseFeeEstimateInertia',
    args: [l2BaseFeeEstimateInertia],
    upgradeExecutor: upgradeExecutorAddress,
    account: owner.address,
  });

  // submit tx to update infra fee receiver
  const txHash = await client.sendRawTransaction({
    serializedTransaction: await owner.signTransaction(transactionRequest),
  });
  await client.waitForTransactionReceipt({ hash: txHash });

  const newL2BaseFeeEstimateInertia = await client.arbGasInfoReadContract({
    functionName: 'getL1BaseFeeEstimateInertia',
  });

  // assert account is now infra fee receiver
  expect(newL2BaseFeeEstimateInertia).toEqual(l2BaseFeeEstimateInertia);
});
