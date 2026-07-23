import { PublicClient, Address } from 'viem';
import { execFile } from 'node:child_process';
import { promisify } from 'util';

import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';

const execFilePromise = promisify(execFile);
const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();

export async function deployTokenBridgeCreator({
  publicClient,
}: {
  publicClient: PublicClient;
}): Promise<Address> {
  const testnodeImage = process.env.TESTNODE_IMAGE;

  if (testnodeImage === undefined) {
    throw new Error('TESTNODE_IMAGE must be defined');
  }

  // https://github.com/OffchainLabs/token-bridge-contracts/blob/main/scripts/local-deployment/deployCreatorAndCreateTokenBridge.ts#L109C19-L109C61
  const weth = '0x05EcEffc7CBA4e43a410340E849052AD43815aCA';

  const { stdout } = await execFilePromise('docker', [
    'run',
    '--rm',
    '--network',
    'host',
    '--workdir',
    '/workspace',
    '--entrypoint',
    'yarn',
    '-e',
    `BASECHAIN_RPC=${publicClient.transport.url}`,
    '-e',
    `BASECHAIN_DEPLOYER_KEY=${testnodeAccounts.deployer.privateKey}`,
    '-e',
    `BASECHAIN_WETH=${weth}`,
    '-e',
    'GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT=10000000',
    '-e',
    'POLLING_INTERVAL=100',
    '-e',
    'DISABLE_CONTRACT_VERIFICATION=true',
    testnodeImage,
    'deploy:token-bridge-creator',
  ]);

  const match = stdout.match(/L1TokenBridgeCreator: (0x[0-9a-fA-F]{40})/);

  if (!match) {
    throw Error(`Failed to parse token bridge creator address from output: ${stdout}`);
  }

  return match[1] as Address;
}
