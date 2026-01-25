import { describe, it, expect } from 'vitest';
import { getInformationFromTestnode, getNitroTestnodePrivateKeyAccounts } from '../testHelpers';
import { Address, createPublicClient, http } from 'viem';
import { nitroTestnodeL2 } from '../chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { upgradeExecutorFetchPrivilegedAccounts } from '../upgradeExecutorFetchPrivilegedAccounts';
import { buildAddExecutor } from './buildAddExecutor';
import { UPGRADE_EXECUTOR_ROLE_EXECUTOR } from '../upgradeExecutorEncodeFunctionData';
import { buildRemoveExecutor } from './buildRemoveExecutor';
import { hasRole } from './hasRole';

const { l3UpgradeExecutor } = getInformationFromTestnode();
const { l3RollupOwner } = getNitroTestnodePrivateKeyAccounts();

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
});

describe('Upgrade executor', () => {
  it('buildAddExecutor and buildRemoveExecutor update upgradeExecutor', async () => {
    async function changeUpgradeExecutor(address: Address, add: boolean) {
      const fn = add ? buildAddExecutor : buildRemoveExecutor;
      const transactionRequest = await fn(client, {
        account: l3RollupOwner.address,
        upgradeExecutor: l3UpgradeExecutor,
        params: {
          address,
        },
      });
      const txHash = await client.sendRawTransaction({
        serializedTransaction: await l3RollupOwner.signTransaction(transactionRequest),
      });
      await client.waitForTransactionReceipt({ hash: txHash });
    }
    const addUpgradeExecutor = (address: Address) => changeUpgradeExecutor(address, true);
    const removeUpgradeExecutor = (address: Address) => changeUpgradeExecutor(address, false);

    const randomAddress = privateKeyToAccount(generatePrivateKey()).address;

    const initialState = await upgradeExecutorFetchPrivilegedAccounts({
      upgradeExecutorAddress: l3UpgradeExecutor,
      publicClient: client,
    });

    expect(
      await hasRole(client, {
        params: {
          role: UPGRADE_EXECUTOR_ROLE_EXECUTOR,
          address: randomAddress,
        },
        upgradeExecutor: l3UpgradeExecutor,
      }),
    ).toBeFalsy();

    await addUpgradeExecutor(randomAddress);
    expect(
      await upgradeExecutorFetchPrivilegedAccounts({
        upgradeExecutorAddress: l3UpgradeExecutor,
        publicClient: client,
      }),
    ).toEqual({
      ...initialState,
      [randomAddress]: [UPGRADE_EXECUTOR_ROLE_EXECUTOR],
    });
    expect(
      await hasRole(client, {
        params: {
          role: UPGRADE_EXECUTOR_ROLE_EXECUTOR,
          address: randomAddress,
        },
        upgradeExecutor: l3UpgradeExecutor,
      }),
    ).toBeTruthy();

    await removeUpgradeExecutor(randomAddress);
    expect(
      await upgradeExecutorFetchPrivilegedAccounts({
        upgradeExecutorAddress: l3UpgradeExecutor,
        publicClient: client,
      }),
    ).toEqual(initialState);
    expect(
      await hasRole(client, {
        params: {
          role: UPGRADE_EXECUTOR_ROLE_EXECUTOR,
          address: randomAddress,
        },
        upgradeExecutor: l3UpgradeExecutor,
      }),
    ).toBeFalsy();
  });
});
