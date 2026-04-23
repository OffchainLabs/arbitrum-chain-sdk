import { Address, PublicClient, Transport, Chain, encodeFunctionData } from 'viem';

import { upgradeExecutorABI } from './contracts/UpgradeExecutor';
import {
  UPGRADE_EXECUTOR_ROLE_EXECUTOR,
  upgradeExecutorEncodeFunctionData,
} from './upgradeExecutorEncodeFunctionData';
import { assertChainId } from './utils/assertChainId';

/**
 * Type for the params of the {@link upgradeExecutorPrepareRemoveExecutorTransactionRequest} function
 */
export type UpgradeExecutorPrepareRemoveExecutorTransactionRequestParams<
  TChain extends Chain | undefined,
> = {
  account: Address;
  upgradeExecutorAddress: Address;
  executorAccountAddress: Address;
  publicClient: PublicClient<Transport, TChain>;
};

/**
 * Prepares a transaction to revoke the executor role from an account
 *
 * - Example: [Add new executor account to UpgradeExecutor](https://github.com/OffchainLabs/arbitrum-orbit-sdk/blob/main/examples/upgrade-executor-add-account/index.ts)
 *
 * @param {UpgradeExecutorPrepareRemoveExecutorTransactionRequestParams} upgradeExecutorPrepareRemoveExecutorTransactionRequestParams {@link UpgradeExecutorPrepareRemoveExecutorTransactionRequestParams}
 * @param {Address} upgradeExecutorPrepareRemoveExecutorTransactionRequestParams.account - Address of the account to be revoked the executor role
 * @param {Address} upgradeExecutorPrepareRemoveExecutorTransactionRequestParams.upgradeExecutorAddress - Address of the UpgradeExecutor contract
 * @param {Address} upgradeExecutorPrepareRemoveExecutorTransactionRequestParams.executorAccountAddress - Address of the account that already has the executor role (will send the transaction)
 * @param {PublicClient} upgradeExecutorPrepareRemoveExecutorTransactionRequestParams.publicClient - The chain Viem Public Client
 *
 * @returns Promise<{@link PrepareTransactionRequestReturnType}> - the transaction request
 *
 * @example
 * const removeExecutorTransactionRequest = await upgradeExecutorPrepareRemoveExecutorTransactionRequest({
 *   account: accountAddress,
 *   upgradeExecutorAddress: coreContracts.upgradeExecutor,
 *   executorAccountAddress: deployer.address,
 *   publicClient,
 * });
 */
export async function upgradeExecutorPrepareRemoveExecutorTransactionRequest<
  TChain extends Chain | undefined,
>({
  account,
  upgradeExecutorAddress,
  executorAccountAddress,
  publicClient,
}: UpgradeExecutorPrepareRemoveExecutorTransactionRequestParams<TChain>) {
  const chainId = assertChainId(publicClient);

  // 0. Verify that the account doesn't have the EXECUTOR role already
  const accountHasExecutorRole = await publicClient.readContract({
    address: upgradeExecutorAddress,
    abi: upgradeExecutorABI,
    functionName: 'hasRole',
    args: [UPGRADE_EXECUTOR_ROLE_EXECUTOR, account],
  });
  if (!accountHasExecutorRole) {
    throw new Error(`Account ${account} does not have the Executor role`);
  }

  // 1. Encode the calldata to be sent in the transaction (through the UpgradeExecutor)
  const revokeRoleCalldata = encodeFunctionData({
    abi: upgradeExecutorABI,
    functionName: 'revokeRole',
    args: [
      UPGRADE_EXECUTOR_ROLE_EXECUTOR, // role
      account, // account
    ],
  });

  if (publicClient.chain === undefined) {
    throw new Error(
      '[upgradeExecutorPrepareRemoveExecutorTransactionRequest] publicClient.chain is undefined',
    );
  }
  const chain: Chain = publicClient.chain;

  // 2. Prepare the transaction (must be called through the UpgradeExecutor)
  const request = await publicClient.prepareTransactionRequest({
    chain,
    type: 'eip1559',
    to: upgradeExecutorAddress,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [upgradeExecutorAddress, revokeRoleCalldata],
    }),
    account: executorAccountAddress,
  });

  return { ...request, chainId };
}
