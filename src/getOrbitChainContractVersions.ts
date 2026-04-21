import type { Address } from 'viem';

import { runOrbitVersioner } from 'orbit-actions';

import { DEFAULT_ORBIT_ACTIONS_IMAGE } from './constants';
import { runDockerCommand } from './runDockerCommand';

export type GetOrbitChainContractVersionsResult = {
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

function parseOrbitChainContractVersionsResult(
  result: string | GetOrbitChainContractVersionsResult,
): GetOrbitChainContractVersionsResult {
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

  return parsed as GetOrbitChainContractVersionsResult;
}

async function getOrbitChainContractVersionsWithDocker(
  inboxAddress: Address,
  parentChainRpc: string,
  image: string,
): Promise<GetOrbitChainContractVersionsResult> {
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

  return parseOrbitChainContractVersionsResult(stdout);
}

async function getOrbitChainContractVersionsWithNative(
  inboxAddress: Address,
  parentChainRpc: string,
): Promise<GetOrbitChainContractVersionsResult> {
  const result = await runOrbitVersioner(inboxAddress, parentChainRpc, true);

  return parseOrbitChainContractVersionsResult(result);
}

export async function getOrbitChainContractVersions(
  inboxAddress: Address,
  parentChainRpc: string,
  executionMode = 'native',
  image = DEFAULT_ORBIT_ACTIONS_IMAGE,
): Promise<GetOrbitChainContractVersionsResult> {
  if (executionMode.toLowerCase() === 'docker') {
    return getOrbitChainContractVersionsWithDocker(inboxAddress, parentChainRpc, image);
  }

  return getOrbitChainContractVersionsWithNative(inboxAddress, parentChainRpc);
}
