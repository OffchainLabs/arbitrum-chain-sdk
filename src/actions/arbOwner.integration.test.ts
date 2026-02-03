import { describe, it, expect } from 'vitest';
import { getNitroTestnodePrivateKeyAccounts } from '../testHelpers';
import { Address, createPublicClient, http, zeroAddress } from 'viem';
import { nitroTestnodeL3 } from '../chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { getAllChainOwners } from './getAllChainOwners';
import { buildAddChainOwner } from './buildAddChainOwner';
import { buildRemoveChainOwner } from './buildRemoveChainOwner';
import { isChainOwner } from './isChainOwner';
import { getInfraFeeAccount } from './getInfraFeeAccount';
import { getNetworkFeeAccount } from './getNetworkFeeAccount';
import { getScheduledUpgrade } from './getScheduledUpgrade';
import { buildSetMaxTxGasLimit } from './buildSetMaxTxGasLimit';
import { buildSetSpeedLimit } from './buildSetSpeedLimit';
import { buildSetParentPricePerUnit } from './buildSetParentPricePerUnit';
import { getParentBaseFeeEstimate } from './getParentBaseFeeEstimate';
import { getGasAccountingParams } from './getGasAccountingParams';
import { buildSetParentPricingRewardRate } from './buildSetParentPricingRewardRate';
import { getParentRewardRate } from './getParentRewardRate';
import { buildSetParentPricingRewardRecipient } from './buildSetParentPricingRewardRecipient';
import { getParentRewardRecipient } from './getParentRewardRecipient';

const { l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();

const client = createPublicClient({
  chain: nitroTestnodeL3,
  transport: http(),
});

let l3UpgradeExecutorAddress: Address = '0x24198F8A339cd3C47AEa3A764A20d2dDaB4D1b5b';

describe('chain owner management', () => {
  it('buildAdd/RemoveChainOwner successfully add and remove chain owner', async () => {
    const randomAddress = privateKeyToAccount(generatePrivateKey()).address;
    expect(await getAllChainOwners(client)).toEqual([l3UpgradeExecutorAddress]);
    expect(await isChainOwner(client, { address: randomAddress })).toBeFalsy();

    const addTransactionRequest = await buildAddChainOwner(client, {
      upgradeExecutor: l3UpgradeExecutorAddress,
      account: l3RollupOwner.address,
      params: {
        newOwner: randomAddress,
      },
    });
    const addTxHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(addTransactionRequest),
    });
    await client.waitForTransactionReceipt({ hash: addTxHash });

    expect(await isChainOwner(client, { address: randomAddress })).toBeTruthy();
    expect(await getAllChainOwners(client)).toEqual([l3UpgradeExecutorAddress, randomAddress]);

    const removeTransactionRequest = await buildRemoveChainOwner(client, {
      upgradeExecutor: l3UpgradeExecutorAddress,
      account: l3RollupOwner.address,
      params: {
        owner: randomAddress,
      },
    });
    const removeTxHash = await client.sendRawTransaction({
      serializedTransaction: await l3RollupOwner.signTransaction(removeTransactionRequest),
    });
    await client.waitForTransactionReceipt({ hash: removeTxHash });

    expect(await getAllChainOwners(client)).toEqual([l3UpgradeExecutorAddress]);
    expect(await isChainOwner(client, { address: randomAddress })).toBeFalsy();
  });
});

describe('Fee account', () => {
  it('getInfraFeeAccount returns the infra fee account', async () => {
    const infraFeeAccount = await getInfraFeeAccount(client);
    expect(infraFeeAccount).toBe(zeroAddress);
  });

  it('getNetworkFeeAccount returns the network fee account', async () => {
    const networkFeeAccount = await getNetworkFeeAccount(client);
    expect(networkFeeAccount).toBe(l3RollupOwner.address);
  });
});

describe('Fee management', () => {
  it('buildSetMaxTxGasLimit successfully set max gas limit for transaction', async () => {
    async function changeMaxTxGasLimit(limit: bigint) {
      const transactionRequest = await buildSetMaxTxGasLimit(client, {
        upgradeExecutor: l3UpgradeExecutorAddress,
        account: l3RollupOwner.address,
        params: {
          limit,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }
    expect((await getGasAccountingParams(client)).maxTxGasLimit).toEqual(32_000_000n);

    await changeMaxTxGasLimit(64_000_000n);
    expect((await getGasAccountingParams(client)).maxTxGasLimit).toEqual(64_000_000n);

    await changeMaxTxGasLimit(32_000_000n);
    expect((await getGasAccountingParams(client)).maxTxGasLimit).toEqual(32_000_000n);
  });

  it('buildSetSpeedLimit successfully speed limit', async () => {
    async function changeSpeedLimit(limit: bigint) {
      const transactionRequest = await buildSetSpeedLimit(client, {
        upgradeExecutor: l3UpgradeExecutorAddress,
        account: l3RollupOwner.address,
        params: {
          limit,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }
    expect((await getGasAccountingParams(client)).speedLimitPerSecond).toEqual(7_000_000n);

    await changeSpeedLimit(14_000_000n);
    expect((await getGasAccountingParams(client)).speedLimitPerSecond).toEqual(14_000_000n);

    await changeSpeedLimit(7_000_000n);
    expect((await getGasAccountingParams(client)).speedLimitPerSecond).toEqual(7_000_000n);
  });

  it('buildSetParentPricePerUnit successfully set parent price per unit', async () => {
    async function changeParentPricePerUnit(pricePerUnit: bigint) {
      const transactionRequest = await buildSetParentPricePerUnit(client, {
        upgradeExecutor: l3UpgradeExecutorAddress,
        account: l3RollupOwner.address,
        params: {
          pricePerUnit,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    const initialParentBaseFeeEstimate = await getParentBaseFeeEstimate(client);

    await changeParentPricePerUnit(100_000_000n);
    expect(await getParentBaseFeeEstimate(client)).toEqual(100_000_000n);

    await changeParentPricePerUnit(initialParentBaseFeeEstimate);
    expect(await getParentBaseFeeEstimate(client)).toEqual(initialParentBaseFeeEstimate);
  });

  it('buildSetParentPricingRewardRate successfully set parent pricing reward rate', async () => {
    async function changeParentPriceRewardRate(weiPerUnit: bigint) {
      const transactionRequest = await buildSetParentPricingRewardRate(client, {
        upgradeExecutor: l3UpgradeExecutorAddress,
        account: l3RollupOwner.address,
        params: {
          weiPerUnit,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    const initialParentPriceRewardRate = await getParentRewardRate(client);

    await changeParentPriceRewardRate(200_000_000n);
    expect(await getParentRewardRate(client)).toEqual(200_000_000n);

    await changeParentPriceRewardRate(initialParentPriceRewardRate);
    expect(await getParentRewardRate(client)).toEqual(initialParentPriceRewardRate);
  });

  it('buildSetParentPricingRewardRecipient successfully set parent pricing reward recipient', async () => {
    async function changeParentPriceRewardRecipient(recipient: Address) {
      const transactionRequest = await buildSetParentPricingRewardRecipient(client, {
        upgradeExecutor: l3UpgradeExecutorAddress,
        account: l3RollupOwner.address,
        params: {
          recipient,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }

    const initialParentPriceRewardRecipient = await getParentRewardRecipient(client);
    expect(initialParentPriceRewardRecipient).toEqual(l3RollupOwner.address);

    const randomAddress = privateKeyToAccount(generatePrivateKey()).address;
    await changeParentPriceRewardRecipient(randomAddress);
    expect(await getParentRewardRecipient(client)).toEqual(randomAddress);

    await changeParentPriceRewardRecipient(initialParentPriceRewardRecipient);
    expect(await getParentRewardRecipient(client)).toEqual(initialParentPriceRewardRecipient);
  });
});

describe('GetScheduledUpgrade', () => {
  it('getScheduledUpgrade returns timestamp and version for next upgrade', async () => {
    expect(await getScheduledUpgrade(client)).toEqual({
      arbosVersion: 0n,
      scheduledForTimestamp: 0n,
    });
  });
});
