import { describe, it, expect } from 'vitest';
import { Address, createPublicClient, createWalletClient, http, parseAbi } from 'viem';

import { nitroTestnodeL2 } from './chains';
import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';
import { deployRollupCreator } from './deployRollupCreator';

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

const rollupCreatorAbi = parseAbi([
  'function bridgeCreator() view returns (address)',
  'function osp() view returns (address)',
  'function challengeManagerTemplate() view returns (address)',
  'function rollupAdminLogic() view returns (address)',
  'function rollupUserLogic() view returns (address)',
  'function upgradeExecutorLogic() view returns (address)',
  'function validatorWalletCreator() view returns (address)',
  'function l2FactoriesDeployer() view returns (address)',
  'function owner() view returns (address)',
]);

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

describe('RollupCreator deployment tests', () => {
  it('deploys a RollupCreator wired to the deployed templates', async () => {
    const result = await deployRollupCreator({ walletClient: nitroTestnodeL2WalletClient });

    const addresses = [
      result.rollupCreator,
      result.bridgeCreator,
      result.osp,
      result.challengeManager,
      result.rollupAdminLogic,
      result.rollupUserLogic,
      result.upgradeExecutor,
      result.validatorWalletCreator,
      result.deployHelper,
    ];
    for (const address of addresses) {
      expect(address).not.toEqual(ADDRESS_ZERO);
    }
    expect(new Set(addresses).size).toEqual(addresses.length);

    const read = (functionName: string) =>
      nitroTestnodeL2Client.readContract({
        address: result.rollupCreator,
        abi: rollupCreatorAbi,
        functionName: functionName as 'bridgeCreator',
      }) as Promise<Address>;

    // On-chain getters must match the deployed addresses, proving the v3.2 constructor wired them.
    expect(await read('bridgeCreator')).toEqual(result.bridgeCreator);
    expect(await read('osp')).toEqual(result.osp);
    expect(await read('challengeManagerTemplate')).toEqual(result.challengeManager);
    expect(await read('rollupAdminLogic')).toEqual(result.rollupAdminLogic);
    expect(await read('rollupUserLogic')).toEqual(result.rollupUserLogic);
    expect(await read('upgradeExecutorLogic')).toEqual(result.upgradeExecutor);
    expect(await read('validatorWalletCreator')).toEqual(result.validatorWalletCreator);
    expect(await read('l2FactoriesDeployer')).toEqual(result.deployHelper);
    expect(await read('owner')).toEqual(deployer.address);
  });
});
