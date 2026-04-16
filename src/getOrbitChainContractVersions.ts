import type { Address } from 'viem';

import { runDockerCommand } from './runDockerCommand';
import { DEFAULT_ORBIT_ACTIONS_IMAGE } from './constants';

export type GetOrbitChainContractVersionsParameters = {
  image?: string;
  inboxAddress: Address;
  networkOrChainId: string | number | bigint;
  parentChainRpc: string;
};

export type GetOrbitChainContractVersionsResult = {
  versions: Record<string, string | null>;
  upgradeRecommendation: unknown;
};

function isChainId(networkOrChainId: string | number | bigint): boolean {
  if (typeof networkOrChainId === 'bigint') {
    return networkOrChainId >= 0n;
  }

  if (typeof networkOrChainId === 'number') {
    return Number.isInteger(networkOrChainId) && networkOrChainId >= 0;
  }

  const numericNetwork = Number(networkOrChainId);

  return Number.isInteger(numericNetwork) && numericNetwork >= 0;
}

function getDockerRpcConfig(parentChainRpc: string): {
  dockerRunArgs?: string[];
  rpcUrl: string;
} {
  const parsed = new URL(parentChainRpc);

  if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    return {
      rpcUrl: parentChainRpc,
    };
  }

  parsed.hostname = 'host.docker.internal';

  return {
    dockerRunArgs: ['--add-host', 'host.docker.internal:host-gateway'],
    rpcUrl: parsed.toString(),
  };
}

function getDockerNetworkConfig(
  networkOrChainId: string | number | bigint,
  parentChainRpc: string,
): {
  dockerRunArgs?: string[];
  env: Record<string, string | undefined>;
  network: string;
} {
  const dockerRpcConfig = getDockerRpcConfig(parentChainRpc);

  if (!isChainId(networkOrChainId)) {
    return {
      dockerRunArgs: dockerRpcConfig.dockerRunArgs,
      network: networkOrChainId.toString(),
      env: { PARENT_CHAIN_RPC: dockerRpcConfig.rpcUrl },
    };
  }

  return {
    dockerRunArgs: dockerRpcConfig.dockerRunArgs,
    network: 'fork',
    env: {
      PARENT_CHAIN_RPC: dockerRpcConfig.rpcUrl,
      FORK_URL: dockerRpcConfig.rpcUrl,
    },
  };
}

export async function getOrbitChainContractVersions({
  image = DEFAULT_ORBIT_ACTIONS_IMAGE,
  inboxAddress,
  networkOrChainId,
  parentChainRpc,
}: GetOrbitChainContractVersionsParameters): Promise<GetOrbitChainContractVersionsResult> {
  const dockerNetworkConfig = getDockerNetworkConfig(networkOrChainId, parentChainRpc);

  const { stdout } = await runDockerCommand({
    image,
    entrypoint: 'yarn',
    ...(dockerNetworkConfig.dockerRunArgs
      ? { dockerRunArgs: dockerNetworkConfig.dockerRunArgs }
      : {}),
    command: [
      '--silent',
      'orbit:contracts:version',
      '--network',
      dockerNetworkConfig.network,
      '--no-compile',
    ],
    env: {
      ...dockerNetworkConfig.env,
      INBOX_ADDRESS: inboxAddress,
      JSON_OUTPUT: 'true',
    },
  });

  let parsed: unknown;

  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch {
    throw new Error('Failed to parse Orbit chain contract versions');
  }

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
