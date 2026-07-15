import { Abi, Address, Hex, WalletClient, getAddress, publicActions } from 'viem';

import testWeth9 from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/test/TestWETH9.sol/TestWETH9.json';

// TestWETH9 is a full WETH9 (deposit/withdraw + ERC20), not a stripped mock; the standard
// WETH9 in the token-bridge repo carries the `Test` prefix. Its constructor takes (name, symbol),
// which are cosmetic for token-bridge wiring, so we deploy the canonical Wrapped Ether values.
const WETH_NAME = 'Wrapped Ether';
const WETH_SYMBOL = 'WETH';

export type DeployWethParams = {
  walletClient: WalletClient;
};

export type DeployWethResult = {
  weth: Address;
  transactionHash: Hex;
};

/**
 * Deploys a WETH9 (wrapped ether) contract on the chain the wallet client is connected to.
 *
 * A freshly created custom parent chain may have no canonical WETH; deployTokenBridgeCreator
 * needs one to wire up the WETH gateway. This deploys a standard WETH9 (18 decimals) so it can be
 * supplied as `l1Weth`.
 *
 * References:
 * - WETH9 contract: https://github.com/OffchainLabs/token-bridge-contracts/blob/main/contracts/tokenbridge/test/TestWETH9.sol
 *
 * @param {DeployWethParams} deployWethParams {@link DeployWethParams}
 * @param {WalletClient} deployWethParams.walletClient - The Viem wallet client (this account deploys the contract)
 *
 * @returns Promise<DeployWethResult> {@link DeployWethResult} - The deployed WETH address and the deployment transaction hash
 *
 * @example
 * const { weth } = await deployWeth({ walletClient });
 */
export async function deployWeth({ walletClient }: DeployWethParams): Promise<DeployWethResult> {
  const client = walletClient.extend(publicActions);

  const transactionHash = await client.deployContract({
    abi: testWeth9.abi as Abi,
    account: walletClient.account!,
    chain: walletClient.chain,
    args: [WETH_NAME, WETH_SYMBOL],
    bytecode: testWeth9.bytecode as Hex,
  });

  const receipt = await client.waitForTransactionReceipt({ hash: transactionHash });

  if (receipt.status === 'reverted' || !receipt.contractAddress) {
    throw new Error(
      `deployWeth: deployment transaction ${transactionHash} reverted (status=${receipt.status})`,
    );
  }

  return {
    weth: getAddress(receipt.contractAddress),
    transactionHash,
  };
}
