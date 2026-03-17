import { PublicClient, WalletClient } from 'viem';
import { getContract } from 'viem';
import { validateParentChain } from './types/ParentChain';
import L1AtomicTokenBridgeCreator from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/ethereum/L1AtomicTokenBridgeCreator.sol/L1AtomicTokenBridgeCreator.json';
import { arbOwnerPublicActions } from './decorators/arbOwnerPublicActions';
import { arbGasInfoPublicActions } from './decorators/arbGasInfoPublicActions';

export type BaseFeeParams = {
  parentChainClient: PublicClient;
  orbitChainClient: PublicClient;
  orbitChainWalletClient: WalletClient;
  tokenBridgeCreatorAddress: `0x${string}`;
  inboxAddress: `0x${string}`;
};

export type SetL2BaseFeeParams = {
  l2BaseFee: bigint;
};

export type SetMinimumL2BaseFeeParams = {
  minimumL2BaseFee: bigint;
};

export async function setL2BaseFee({
  parentChainClient,
  orbitChainClient,
  orbitChainWalletClient,
  tokenBridgeCreatorAddress,
  inboxAddress,
  l2BaseFee,
}: BaseFeeParams & SetL2BaseFeeParams) {
  validateParentChain(parentChainClient);
  const account = orbitChainWalletClient.account?.address;

  if (typeof account === 'undefined') {
    throw new Error('account is undefined');
  }

  const extendedOrbitChainClient = orbitChainClient
    .extend(arbOwnerPublicActions)
    .extend(arbGasInfoPublicActions);

  const upgradeExecutorProxyAddress = await getUpgradeExecutorProxyAddress(
    tokenBridgeCreatorAddress,
    inboxAddress,
    orbitChainClient,
  );

  const transactionRequest = await extendedOrbitChainClient.arbOwnerPrepareTransactionRequest({
    functionName: 'setL2BaseFee',
    args: [l2BaseFee],
    upgradeExecutor: upgradeExecutorProxyAddress,
    account: account,
  });

  // submit tx to set l2 base fee
  return await extendedOrbitChainClient.sendRawTransaction({
    serializedTransaction: await orbitChainWalletClient.signTransaction(transactionRequest),
  });
}

export async function setMinimumL2BaseFee({
  parentChainClient,
  orbitChainClient,
  orbitChainWalletClient,
  tokenBridgeCreatorAddress,
  inboxAddress,
  minimumL2BaseFee,
}: BaseFeeParams & SetMinimumL2BaseFeeParams) {
  validateParentChain(parentChainClient);
  const account = orbitChainWalletClient.account?.address;

  if (typeof account === 'undefined') {
    throw new Error('account is undefined');
  }

  const extendedOrbitChainClient = orbitChainClient
    .extend(arbOwnerPublicActions)
    .extend(arbGasInfoPublicActions);

  const upgradeExecutorProxyAddress = await getUpgradeExecutorProxyAddress(
    tokenBridgeCreatorAddress,
    inboxAddress,
    orbitChainClient,
  );

  const transactionRequest = await extendedOrbitChainClient.arbOwnerPrepareTransactionRequest({
    functionName: 'setMinimumL2BaseFee',
    args: [minimumL2BaseFee],
    upgradeExecutor: upgradeExecutorProxyAddress,
    account: account,
  });

  // submit tx to set minimum l2 base fee
  return await extendedOrbitChainClient.sendRawTransaction({
    serializedTransaction: await orbitChainWalletClient.signTransaction(transactionRequest),
  });
}

async function getUpgradeExecutorProxyAddress(
  tokenBridgeCreatorAddress: `0x${string}`,
  inboxAddress: `0x${string}`,
  publicClient: PublicClient,
): Promise<`0x${string}`> {
  const tokenBridgeCreator = getContract({
    address: tokenBridgeCreatorAddress,
    abi: L1AtomicTokenBridgeCreator.abi,
    publicClient: publicClient,
  });
  const deployment: any = await tokenBridgeCreator.read.inboxToL2Deployment([inboxAddress]);
  return deployment.upgradeExecutor as `0x${string}`;
}
