import { Address, Hex, WalletClient } from 'viem';

import { deployContractChecked, toDeployContext } from './utils/deployContract';

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
  const ctx = toDeployContext(walletClient, 'deployWeth');
  const { address, transactionHash } = await deployContractChecked(ctx, 'TestWETH9', testWeth9, [
    WETH_NAME,
    WETH_SYMBOL,
  ]);

  return { weth: address, transactionHash };
}
