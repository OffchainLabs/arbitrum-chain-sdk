import { Address, PublicClient, Transport, Chain } from 'viem';
import { AbiEvent } from 'abitype';
import { UpgradeExecutorRole } from './upgradeExecutorEncodeFunctionData';

/**
 * This type is for the params of the {@link upgradeExecutorFetchPrivilegedAccounts} function
 */
export type UpgradeExecutorFetchPrivilegedAccountsParams<TChain extends Chain | undefined> = {
  upgradeExecutorAddress: Address;
  publicClient: PublicClient<Transport, TChain>;
};

/**
 * This type is for the result of the {@link upgradeExecutorFetchPrivilegedAccounts} function.
 *
 * It is an object containing the addresses of the privileged accounts as keys,
 * and an array with a hash for each role they have.
 */
export type UpgradeExecutorPrivilegedAccounts = {
  // Key: account
  // Value: array of roles
  [account: `0x${string}`]: UpgradeExecutorRole[];
};

const RoleGrantedEventAbi = {
  inputs: [
    {
      indexed: true,
      internalType: 'bytes32',
      name: 'role',
      type: 'bytes32',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'account',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'sender',
      type: 'address',
    },
  ],
  name: 'RoleGranted',
  type: 'event',
} as const satisfies AbiEvent;

const RoleRevokedEventAbi = {
  inputs: [
    {
      indexed: true,
      internalType: 'bytes32',
      name: 'role',
      type: 'bytes32',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'account',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'sender',
      type: 'address',
    },
  ],
  name: 'RoleRevoked',
  type: 'event',
} as const satisfies AbiEvent;

/**
 * Returns all accounts that have been granted a role in the UpgradeExecutor
 *
 * Returns an object containing the addresses of the privileged accounts as keys, and an array with a hash for each role they have.
 *
 * @param {UpgradeExecutorFetchPrivilegedAccountsParams} upgradeExecutorFetchPrivilegedAccountsParams {@link UpgradeExecutorFetchPrivilegedAccountsParams}
 * @param {Address} upgradeExecutorFetchPrivilegedAccountsParams.upgradeExecutorAddress - Address of the UpgradeExecutor
 * @param {PublicClient} upgradeExecutorFetchPrivilegedAccountsParams.publicClient - The chain Viem Public Client
 *
 * @returns Promise<{@link UpgradeExecutorPrivilegedAccounts}> - an object containing the addresses of the privileged accounts as keys, and an array with a hash for each role they have
 *
 * @example
 * const privilegedAccounts = await upgradeExecutorFetchPrivilegedAccounts({
 *   upgradeExecutorAddress,
 *   publicClient,
 * });
 */
export async function upgradeExecutorFetchPrivilegedAccounts<TChain extends Chain | undefined>({
  upgradeExecutorAddress,
  publicClient,
}: UpgradeExecutorFetchPrivilegedAccountsParams<TChain>) {
  // 0. Initialize result object
  const upgradeExecutorPrivilegedAccounts: UpgradeExecutorPrivilegedAccounts = {};

  // 1. Find the RoleGranted events
  const roleGrantedEvents = await publicClient.getLogs({
    address: upgradeExecutorAddress,
    event: RoleGrantedEventAbi,
    fromBlock: 0n,
    toBlock: 'latest',
  });
  if (!roleGrantedEvents || roleGrantedEvents.length <= 0) {
    // No roles have been granted
    return upgradeExecutorPrivilegedAccounts;
  }

  // 2. Add the privileged accounts to the result object
  roleGrantedEvents.forEach((roleGrantedEvent) => {
    const account = roleGrantedEvent.args.account!;
    const role = roleGrantedEvent.args.role!;

    if (!(account in upgradeExecutorPrivilegedAccounts)) {
      upgradeExecutorPrivilegedAccounts[account] = [];
    }
    upgradeExecutorPrivilegedAccounts[account].push(role);
  });

  // 3. Find the RoleRevoked events
  const roleRevokedEvents = await publicClient.getLogs({
    address: upgradeExecutorAddress,
    event: RoleRevokedEventAbi,
    fromBlock: 0n,
    toBlock: 'latest',
  });
  if (!roleRevokedEvents || roleRevokedEvents.length <= 0) {
    return upgradeExecutorPrivilegedAccounts;
  }

  // 3. Remove the revoked roles from the result object
  // (Note: if the same role has been added and revoked multiple times, it will be added and removed multiple times from upgradeExecutorPrivilegedAccounts[account] )
  roleRevokedEvents.forEach((roleRevokedEvent) => {
    const account = roleRevokedEvent.args.account!;
    const role = roleRevokedEvent.args.role!;

    const roleIndex = upgradeExecutorPrivilegedAccounts[account].findIndex(
      (accRole) => accRole == role,
    );
    if (roleIndex >= 0) {
      upgradeExecutorPrivilegedAccounts[account].splice(roleIndex, 1);
      if (upgradeExecutorPrivilegedAccounts[account].length === 0) {
        delete upgradeExecutorPrivilegedAccounts[account];
      }
    }
  });

  return upgradeExecutorPrivilegedAccounts;
}
