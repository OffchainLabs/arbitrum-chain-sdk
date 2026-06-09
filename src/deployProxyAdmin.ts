import { Address, Hex, WalletClient, getAddress, publicActions } from 'viem';

import proxyAdmin from '@arbitrum/nitro-contracts/build/contracts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';

/**
 * This type is for the params of the deployProxyAdmin function
 */
export type DeployProxyAdminParams = {
  orbitChainWalletClient: WalletClient;
};

/**
 * This type is for the result of the deployProxyAdmin function
 */
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
 * // proxyAdmin can now be passed straight into deployExpressLaneAuction
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

  // Wait for the receipt to resolve the deployed address before returning, so the
  // caller can feed it straight into deployExpressLaneAuction as the proxy admin.
  const receipt = await client.waitForTransactionReceipt({ hash: transactionHash });

  // waitForTransactionReceipt does not reject on revert in this viem version, so a
  // reverted deploy yields contractAddress: null; surface it with the tx hash instead
  // of letting getAddress(null) throw an opaque InvalidAddressError.
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
