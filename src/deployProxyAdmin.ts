import { Address, Hex, WalletClient, publicActions } from 'viem';

import { deployContractChecked } from './utils/deployContract';

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
 */
export async function deployProxyAdmin({
  orbitChainWalletClient,
}: DeployProxyAdminParams): Promise<DeployProxyAdminResult> {
  const ctx = { client: orbitChainWalletClient.extend(publicActions), label: 'deployProxyAdmin' };
  const { address, transactionHash } = await deployContractChecked(ctx, 'ProxyAdmin', proxyAdmin);

  return { proxyAdmin: address, transactionHash };
}
