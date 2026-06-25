import { Address, Hex, WalletClient, getAddress, publicActions } from 'viem';

import proxyAdmin from '@arbitrum/nitro-contracts/build/contracts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';

export type DeployProxyAdminParams = {
  orbitChainWalletClient: WalletClient;
};

export type DeployProxyAdminResult = {
  proxyAdmin: Address;
  transactionHash: Hex;
};

/**
 * Deploys an OpenZeppelin ProxyAdmin on the orbit (child) chain.
 *
 * The ProxyAdmin is the contract that owns and upgrades TransparentUpgradeableProxy instances.
 * Its constructor takes no arguments; OZ's Ownable sets the owner to msg.sender, so the account
 * behind orbitChainWalletClient becomes the ProxyAdmin owner.
 *
 * References:
 * - ProxyAdmin contract: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.7/contracts/proxy/transparent/ProxyAdmin.sol
 *
 * @param {DeployProxyAdminParams} deployProxyAdminParams {@link DeployProxyAdminParams}
 * @param {WalletClient} deployProxyAdminParams.orbitChainWalletClient - The orbit chain Viem wallet client (this account deploys the contract and becomes the ProxyAdmin owner)
 *
 * @returns Promise<DeployProxyAdminResult> {@link DeployProxyAdminResult} - The deployed ProxyAdmin address and the deployment transaction hash
 *
 * @example
 * const { proxyAdmin } = await deployProxyAdmin({
 *   orbitChainWalletClient,
 * });
 */
export async function deployProxyAdmin({
  orbitChainWalletClient,
}: DeployProxyAdminParams): Promise<DeployProxyAdminResult> {
  const client = orbitChainWalletClient.extend(publicActions);

  const transactionHash = await client.deployContract({
    abi: proxyAdmin.abi,
    account: orbitChainWalletClient.account!,
    chain: orbitChainWalletClient.chain,
    bytecode: proxyAdmin.bytecode as Hex,
  });

  const receipt = await client.waitForTransactionReceipt({ hash: transactionHash });

  if (receipt.status === 'reverted' || !receipt.contractAddress) {
    throw new Error(
      `deployProxyAdmin: deployment transaction ${transactionHash} reverted (status=${receipt.status})`,
    );
  }

  return {
    proxyAdmin: getAddress(receipt.contractAddress),
    transactionHash,
  };
}
