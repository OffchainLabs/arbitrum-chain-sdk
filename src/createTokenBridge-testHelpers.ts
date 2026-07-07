import { PublicClient, Address } from 'viem';
import { execFile } from 'node:child_process';
import { promisify } from 'util';

import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';

const execFilePromise = promisify(execFile);
const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const tokenBridgeContractsImage = 'arbitrum-chain-sdk-token-bridge-contracts:v1.2.2';

let tokenBridgeContractsImagePromise: Promise<string> | undefined;

async function buildTokenBridgeContractsImage() {
  if (typeof tokenBridgeContractsImagePromise !== 'undefined') {
    return tokenBridgeContractsImagePromise;
  }

  tokenBridgeContractsImagePromise = (async () => {
    await execFilePromise(
      'docker',
      ['build', '-q', '-t', tokenBridgeContractsImage, 'token-bridge-contracts'],
      {
        maxBuffer: 1024 * 1024 * 10,
      },
    );
    return tokenBridgeContractsImage;
  })();

  return tokenBridgeContractsImagePromise;
}

export async function deployTokenBridgeCreator({
  publicClient,
}: {
  publicClient: PublicClient;
}): Promise<Address> {
  // https://github.com/OffchainLabs/token-bridge-contracts/blob/main/scripts/local-deployment/deployCreatorAndCreateTokenBridge.ts#L109C19-L109C61
  const weth = '0x05EcEffc7CBA4e43a410340E849052AD43815aCA';
  const image = await buildTokenBridgeContractsImage();

  const { stdout } = await execFilePromise(
    'docker',
    [
      'run',
      '--rm',
      '--net=host',
      '-e',
      `BASECHAIN_RPC=${publicClient.transport.url}`,
      '-e',
      `BASECHAIN_DEPLOYER_KEY=${testnodeAccounts.deployer.privateKey}`,
      '-e',
      `BASECHAIN_WETH=${weth}`,
      '-e',
      'GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT=10000000',
      image,
      'deploy:token-bridge-creator',
    ],
    {
      maxBuffer: 1024 * 1024 * 10,
    },
  );

  const match = stdout.match(/L1TokenBridgeCreator: (0x[0-9a-fA-F]{40})/);

  if (!match) {
    throw Error(`Failed to parse token bridge creator address from output: ${stdout}`);
  }

  return match[1] as Address;
}
