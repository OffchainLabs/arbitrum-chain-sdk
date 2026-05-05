import type { Address } from 'viem';

import { runChainVersioner } from '@arbitrum/chain-actions';

import { DEFAULT_CHAIN_ACTIONS_IMAGE } from './constants';
import { runDockerCommand } from './runDockerCommand';
import { verifyFoundryBinaries } from './utils/verifyFoundry';

export type GetChainContractVersionsResult = {
  versions: Record<string, string | null>;
  upgradeRecommendation: unknown;
};

function getDockerNetworkConfig(parentChainRpc: string): {
  rpcUrl: string;
  dockerRunArgs?: string[];
} {
  const parsed = new URL(parentChainRpc);

  if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    return {
      rpcUrl: parentChainRpc,
    };
  }

  parsed.hostname = 'host.docker.internal';

  return {
    rpcUrl: parsed.toString(),
    dockerRunArgs: ['--add-host', 'host.docker.internal:host-gateway'],
  };
}

function parseChainContractVersionsResult(
  result: string | GetChainContractVersionsResult,
): GetChainContractVersionsResult {
  const parsed =
    typeof result === 'string'
      ? (() => {
          try {
            return JSON.parse(result) as unknown;
          } catch {
            throw new Error('Failed to parse Orbit chain contract versions');
          }
        })()
      : result;

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('versions' in parsed) ||
    !('upgradeRecommendation' in parsed)
  ) {
    throw new Error('Failed to parse Orbit chain contract versions');
  }

  return parsed as GetChainContractVersionsResult;
}

async function getChainContractVersionsWithDocker(
  inboxAddress: Address,
  parentChainRpc: string,
  image: string,
): Promise<GetChainContractVersionsResult> {
  const dockerConfig = getDockerNetworkConfig(parentChainRpc);

  const { stdout } = await runDockerCommand({
    image,
    entrypoint: 'yarn',
    ...(dockerConfig.dockerRunArgs ? { dockerRunArgs: dockerConfig.dockerRunArgs } : {}),
    command: ['--silent', 'orbit:contracts:version'],
    env: {
      INBOX_ADDRESS: inboxAddress,
      PARENT_CHAIN_RPC: dockerConfig.rpcUrl,
      JSON_OUTPUT: 'true',
    },
  });

  return parseChainContractVersionsResult(stdout);
}

async function getChainContractVersionsWithNative(
  inboxAddress: Address,
  parentChainRpc: string,
): Promise<GetChainContractVersionsResult> {
  await verifyFoundryBinaries();

  const result = await runChainVersioner(inboxAddress, parentChainRpc, true);

  return parseChainContractVersionsResult(result);
}

export async function getChainContractVersions(
  inboxAddress: Address,
  parentChainRpc: string,
  executionMode = 'native',
  image = DEFAULT_CHAIN_ACTIONS_IMAGE,
): Promise<GetChainContractVersionsResult> {
  if (executionMode.toLowerCase() === 'docker') {
    return getChainContractVersionsWithDocker(inboxAddress, parentChainRpc, image);
  }

  return getChainContractVersionsWithNative(inboxAddress, parentChainRpc);
}
