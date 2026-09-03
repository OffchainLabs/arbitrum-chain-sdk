import { describe, it, expect } from 'vitest';
import { createPublicClient, createWalletClient, http, parseAbi, parseEther } from 'viem';

import { nitroTestnodeL2 } from './chains';
import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { deployWeth } from './deployWeth';

const deployer = getNitroTestnodePrivateKeyAccounts().deployer;

const nitroTestnodeL2Client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
});
const nitroTestnodeL2WalletClient = createWalletClient({
  chain: nitroTestnodeL2,
  transport: http(nitroTestnodeL2.rpcUrls.default.http[0]),
  account: deployer,
});

const wethAbi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function deposit() payable',
  'function balanceOf(address) view returns (uint256)',
]);

describe('WETH deployment tests', () => {
  it('successfully deploys a WETH9 with the expected metadata and deposit behaviour', async () => {
    const { weth } = await deployWeth({ walletClient: nitroTestnodeL2WalletClient });

    expect(weth).not.toEqual('0x0000000000000000000000000000000000000000');

    const name = await nitroTestnodeL2Client.readContract({
      address: weth,
      abi: wethAbi,
      functionName: 'name',
    });
    expect(name).toEqual('Wrapped Ether');

    const symbol = await nitroTestnodeL2Client.readContract({
      address: weth,
      abi: wethAbi,
      functionName: 'symbol',
    });
    expect(symbol).toEqual('WETH');

    const decimals = await nitroTestnodeL2Client.readContract({
      address: weth,
      abi: wethAbi,
      functionName: 'decimals',
    });
    expect(decimals).toEqual(18);

    // Deposit round-trip proves it is a real WETH9, not just an ERC20 with the right metadata.
    const depositAmount = parseEther('1');
    const depositHash = await nitroTestnodeL2WalletClient.writeContract({
      address: weth,
      abi: wethAbi,
      functionName: 'deposit',
      value: depositAmount,
    });
    await nitroTestnodeL2Client.waitForTransactionReceipt({ hash: depositHash });

    const balance = await nitroTestnodeL2Client.readContract({
      address: weth,
      abi: wethAbi,
      functionName: 'balanceOf',
      args: [deployer.address],
    });
    expect(balance).toEqual(depositAmount);
  });
});
