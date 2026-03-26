import { PublicClient, Address } from 'viem';
import { exec } from 'node:child_process';
import { promisify } from 'util';

import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';

const execPromise = promisify(exec);

export async function deployTokenBridgeCreator({
  publicClient,
}: {
  publicClient: PublicClient;
}): Promise<Address> {
  // https://github.com/OffchainLabs/token-bridge-contracts/blob/main/scripts/local-deployment/deployCreatorAndCreateTokenBridge.ts#L109C19-L109C61
  const weth = '0x05EcEffc7CBA4e43a410340E849052AD43815aCA';
  const { deployer } = getNitroTestnodePrivateKeyAccounts();

  const { stdout } = await execPromise(`
      docker run --rm --net=host \
        -e BASECHAIN_RPC=${publicClient.transport.url} \
        -e BASECHAIN_DEPLOYER_KEY=${deployer.privateKey} \
        -e BASECHAIN_WETH=${weth} \
        -e GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT=10000000 \
        $(docker build -q token-bridge-contracts) deploy:token-bridge-creator`);

  const match = stdout.match(/L1TokenBridgeCreator: (0x[0-9a-fA-F]{40})/);

  if (!match) {
    throw Error(`Failed to parse token bridge creator address from output: ${stdout}`);
  }

  return match[1] as Address;
}
