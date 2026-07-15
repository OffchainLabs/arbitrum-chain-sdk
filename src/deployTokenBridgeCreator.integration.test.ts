import { describe, it, expect } from 'vitest';
import { Address, createPublicClient, createWalletClient, http, parseAbi } from 'viem';

import { nitroTestnodeL2 } from './chains';
import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { deployWeth } from './deployWeth';
import { deployTokenBridgeCreator } from './deployTokenBridgeCreator';

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

const creatorAbi = parseAbi([
  'function retryableSender() view returns (address)',
  'function l1Weth() view returns (address)',
  'function l1Multicall() view returns (address)',
  'function owner() view returns (address)',
  'function gasLimitForL2FactoryDeployment() view returns (uint256)',
  'function canonicalL2FactoryAddress() view returns (address)',
  'function l2TokenBridgeFactoryTemplate() view returns (address)',
  'function l2RouterTemplate() view returns (address)',
  'function l2StandardGatewayTemplate() view returns (address)',
  'function l2CustomGatewayTemplate() view returns (address)',
  'function l2WethGatewayTemplate() view returns (address)',
  'function l2WethTemplate() view returns (address)',
  'function l2MulticallTemplate() view returns (address)',
  'function l1Templates() view returns (address, address, address, address, address, address, address, address)',
]);

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

describe('TokenBridgeCreator deployment tests', () => {
  it('deploys a token bridge creator wired to its templates', async () => {
    const { weth } = await deployWeth({ walletClient: nitroTestnodeL2WalletClient });

    const result = await deployTokenBridgeCreator({
      walletClient: nitroTestnodeL2WalletClient,
      l1Weth: weth,
    });

    expect(result.tokenBridgeCreator).not.toEqual(ADDRESS_ZERO);
    expect(result.retryableSender).not.toEqual(ADDRESS_ZERO);
    expect(result.proxyAdmin).not.toEqual(ADDRESS_ZERO);

    const read = (functionName: string) =>
      nitroTestnodeL2Client.readContract({
        address: result.tokenBridgeCreator,
        abi: creatorAbi,
        functionName: functionName as 'retryableSender',
      });

    // initialize wired the retryable sender and the passed WETH; setTemplates stored the rest.
    expect(await read('retryableSender')).toEqual(result.retryableSender);
    expect(await read('l1Weth')).toEqual(weth);
    expect(await read('owner')).toEqual(deployer.address);
    expect(await read('gasLimitForL2FactoryDeployment')).toEqual(10_000_000n);
    // canonicalL2FactoryAddress is computed on-chain by initialize; a non-zero value proves it ran.
    expect(await read('canonicalL2FactoryAddress')).not.toEqual(ADDRESS_ZERO);

    // Every L2 template placeholder must be stored (non-zero).
    for (const getter of [
      'l1Multicall',
      'l2TokenBridgeFactoryTemplate',
      'l2RouterTemplate',
      'l2StandardGatewayTemplate',
      'l2CustomGatewayTemplate',
      'l2WethGatewayTemplate',
      'l2WethTemplate',
      'l2MulticallTemplate',
    ] as const) {
      expect(await read(getter), getter).not.toEqual(ADDRESS_ZERO);
    }

    // The L1 template struct must be fully populated (no zero fields).
    const l1Templates = (await read('l1Templates')) as unknown as readonly Address[];
    for (const template of l1Templates) {
      expect(template).not.toEqual(ADDRESS_ZERO);
    }
  });
});
