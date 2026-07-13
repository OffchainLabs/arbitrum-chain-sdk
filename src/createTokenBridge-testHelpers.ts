import { PublicClient, Address } from 'viem';
import { execFile } from 'node:child_process';
import { promisify } from 'util';

import { getNitroTestnodePrivateKeyAccounts } from './testHelpers';

const execFilePromise = promisify(execFile);
const testnodeAccounts = getNitroTestnodePrivateKeyAccounts();
const tokenBridgeContractsImage =
  process.env.TOKEN_BRIDGE_CONTRACTS_IMAGE ?? 'arbitrum-chain-sdk-token-bridge-contracts:v1.2.2';
const skipTokenBridgeContractsImageBuild = process.env.TOKEN_BRIDGE_CONTRACTS_SKIP_BUILD === 'true';

let tokenBridgeContractsImagePromise: Promise<string> | undefined;

async function buildTokenBridgeContractsImage() {
  if (typeof tokenBridgeContractsImagePromise !== 'undefined') {
    return tokenBridgeContractsImagePromise;
  }

  tokenBridgeContractsImagePromise = (async () => {
    if (skipTokenBridgeContractsImageBuild) {
      await execFilePromise('docker', ['image', 'inspect', tokenBridgeContractsImage]);
      return tokenBridgeContractsImage;
    }

    await execFilePromise('docker', [
      'build',
      '-q',
      '-t',
      tokenBridgeContractsImage,
      'token-bridge-contracts',
    ]);
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

  const { stdout } = await execFilePromise('docker', [
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
  ]);

  const match = stdout.match(/L1TokenBridgeCreator: (0x[0-9a-fA-F]{40})/);

  if (!match) {
    throw Error(`Failed to parse token bridge creator address from output: ${stdout}`);
  }

  return match[1] as Address;
}
