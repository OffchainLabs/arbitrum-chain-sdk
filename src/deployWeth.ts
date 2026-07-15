import { Abi, Address, Hex, WalletClient, getAddress, publicActions } from 'viem';

import testWeth9 from '@arbitrum/token-bridge-contracts/build/contracts/contracts/tokenbridge/test/TestWETH9.sol/TestWETH9.json';

// TestWETH9 is a full WETH9 (deposit/withdraw), not a stripped mock, despite the `Test` prefix.
const WETH_NAME = 'Wrapped Ether';
const WETH_SYMBOL = 'WETH';

export type DeployWethParams = {
  walletClient: WalletClient;
};

export type DeployWethResult = {
  weth: Address;
  transactionHash: Hex;
};

// Deploys a standard WETH9 on the chain the wallet client points at, so a custom parent chain with
// no canonical WETH can supply one as `l1Weth` to deployTokenBridgeCreator.
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
