import { execFile, execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { createPublicClient, http, Address } from 'viem';

import { testConstants } from './constants';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

export function docker(args: string[]): string {
  return runCommand('docker', args);
}

export function dockerAsync(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'docker',
      args,
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`${error.message}${stderr ? `\n${stderr}` : ''}`));
          return;
        }

        resolve(stdout.trim());
      },
    );
  });
}

export function getNitroContractsImage(): string {
  const image =
    process.env.NITRO_CONTRACTS_GHCR_IMAGE ?? testConstants.DEFAULT_NITRO_CONTRACTS_IMAGE;
  try {
    docker(['image', 'inspect', image]);
    return image;
  } catch {
    const nitroContractsDir = join(process.cwd(), 'nitro-contracts');
    const dockerfilePath = join(process.cwd(), 'nitro-contracts', 'Dockerfile');
    docker(['build', '-f', dockerfilePath, '-t', image, nitroContractsDir]);

    return image;
  }
}

export function getTokenBridgeContractsImage(): string {
  const image =
    process.env.TOKEN_BRIDGE_CONTRACTS_GHCR_IMAGE ??
    testConstants.DEFAULT_TOKEN_BRIDGE_CONTRACTS_IMAGE;
  try {
    docker(['image', 'inspect', image]);
    return image;
  } catch {
    const tokenBridgeContractsDir = join(process.cwd(), 'token-bridge-contracts');
    const dockerfilePath = join(tokenBridgeContractsDir, 'Dockerfile');
    docker(['build', '-f', dockerfilePath, '-t', image, tokenBridgeContractsDir]);

    return image;
  }
}

export function getRollupCreatorDockerArgs(
  params: {
    rpcUrl: string;
    deployerPrivateKey: `0x${string}`;
    factoryOwner: Address;
    maxDataSize: number;
    chainId: number;
  },
  nitroContractsImage: string,
) {
  return [
    'run',
    '--rm',
    '--add-host',
    'host.docker.internal:host-gateway',
    '-e',
    `CUSTOM_RPC_URL=${params.rpcUrl}`,
    '-e',
    `CUSTOM_PRIVKEY=${params.deployerPrivateKey}`,
    '-e',
    `CUSTOM_CHAINID=${params.chainId}`,
    '-e',
    `FACTORY_OWNER=${params.factoryOwner}`,
    '-e',
    `MAX_DATA_SIZE=${params.maxDataSize}`,
    '-e',
    `POLLING_INTERVAL=${testConstants.NITRO_DEPLOY_POLLING_INTERVAL_MS}`,
    '-e',
    'DISABLE_VERIFICATION=true',
    '-e',
    'IGNORE_MAX_DATA_SIZE_WARNING=true',
    nitroContractsImage,
    'hardhat',
    'run',
    '--no-compile',
    'scripts/deployment.ts',
    '--network',
    'custom',
  ];
}

export function getTokenBridgeCreatorDockerArgs(
  params: {
    networkName?: string;
    rpcUrl: string;
    deployerPrivateKey: `0x${string}`;
    wethAddress: Address;
    addHostDockerInternal?: boolean;
  },
  tokenBridgeContractsImage: string,
) {
  return [
    'run',
    '--rm',
    ...(params.networkName ? ['--network', params.networkName] : []),
    ...(params.addHostDockerInternal ? ['--add-host', 'host.docker.internal:host-gateway'] : []),
    '-e',
    `BASECHAIN_RPC=${params.rpcUrl}`,
    '-e',
    `BASECHAIN_DEPLOYER_KEY=${params.deployerPrivateKey}`,
    '-e',
    `BASECHAIN_WETH=${params.wethAddress}`,
    '-e',
    `GAS_LIMIT_FOR_L2_FACTORY_DEPLOYMENT=10000000`,
    tokenBridgeContractsImage,
    'deploy:token-bridge-creator',
  ];
}

export function createDockerNetwork(networkName: string) {
  docker(['network', 'create', networkName]);
}

function getContainerStatus(containerName: string): string | undefined {
  try {
    const status = docker(['inspect', '-f', '{{.State.Status}}', containerName]);
    return status || undefined;
  } catch {
    return undefined;
  }
}

function getContainerLogs(containerName: string, tail = 80): string {
  try {
    return docker(['logs', '--tail', String(tail), containerName]);
  } catch {
    return '';
  }
}

export async function waitForRpc(params: {
  rpcUrl: string;
  timeoutMs: number;
  failIfContainerExited?: string;
}) {
  const { rpcUrl, timeoutMs, failIfContainerExited } = params;
  const publicClient = createPublicClient({ transport: http(rpcUrl) });
  const deadline = Date.now() + timeoutMs;

  const poll = async (): Promise<void> => {
    if (failIfContainerExited) {
      const status = getContainerStatus(failIfContainerExited);
      if (status && status !== 'running') {
        const logs = getContainerLogs(failIfContainerExited);
        throw new Error(
          `Container ${failIfContainerExited} exited with status "${status}" while waiting for RPC ${rpcUrl}.${
            logs ? `\n${logs}` : ''
          }`,
        );
      }
    }

    try {
      await publicClient.getChainId();
      return;
    } catch {
      if (Date.now() >= deadline) {
        const containerContext =
          failIfContainerExited && getContainerStatus(failIfContainerExited)
            ? ` (container ${failIfContainerExited} status: ${getContainerStatus(
                failIfContainerExited,
              )})`
            : '';
        const logs =
          failIfContainerExited && getContainerStatus(failIfContainerExited) !== 'running'
            ? getContainerLogs(failIfContainerExited)
            : '';
        throw new Error(
          `Timed out waiting for RPC ${rpcUrl}${containerContext}.${logs ? `\n${logs}` : ''}`,
        );
      }
    }

    await sleep(1000);
    return poll();
  };

  return poll();
}

export function forceRemoveContainer(containerName: string) {
  try {
    execFileSync('docker', ['rm', '-f', containerName], { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

export function forceRemoveNetwork(networkName: string) {
  try {
    execFileSync('docker', ['network', 'rm', networkName], { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

export function cleanupCurrentHarnessResources(params: {
  l3ContainerName?: string;
  l2ContainerName?: string;
  l1ContainerName?: string;
  dockerNetworkName?: string;
  runtimeDir?: string;
}) {
  if (params.l3ContainerName) {
    forceRemoveContainer(params.l3ContainerName);
  }

  if (params.l2ContainerName) {
    forceRemoveContainer(params.l2ContainerName);
  }

  if (params.l1ContainerName) {
    forceRemoveContainer(params.l1ContainerName);
  }

  if (params.dockerNetworkName) {
    forceRemoveNetwork(params.dockerNetworkName);
  }

  if (params.runtimeDir) {
    try {
      rmSync(params.runtimeDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

export function cleanupStaleHarnessContainers() {
  try {
    const ids = docker(['ps', '-aq', '--filter', 'name=^chain-sdk-int-test-(l1|l2|l3)-']);
    if (!ids) {
      return;
    }

    const containerIds = ids
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    if (containerIds.length) {
      execFileSync('docker', ['rm', '-f', ...containerIds], { stdio: 'ignore' });
    }
  } catch {
    // ignore
  }
}

export function cleanupStaleHarnessNetworks() {
  try {
    const ids = docker(['network', 'ls', '-q', '--filter', 'name=^chain-sdk-int-test-net-']);
    if (!ids) {
      return;
    }

    const networkIds = ids
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    if (networkIds.length) {
      execFileSync('docker', ['network', 'rm', ...networkIds], { stdio: 'ignore' });
    }
  } catch {
    // ignore
  }
}

export function startL1AnvilContainer(params: {
  containerName: string;
  networkName: string;
  l1RpcPort: number;
  anvilImage: string;
  anvilForkUrl: string;
  anvilForkBlockNumber: number;
  chainId: number;
}) {
  docker([
    'run',
    '-d',
    '--name',
    params.containerName,
    '--network',
    params.networkName,
    '--add-host',
    'host.docker.internal:host-gateway',
    '--entrypoint',
    'anvil',
    '-p',
    `${params.l1RpcPort}:8545`,
    params.anvilImage,
    '--fork-url',
    params.anvilForkUrl,
    '--fork-block-number',
    String(params.anvilForkBlockNumber),
    '--host',
    '0.0.0.0',
    '--port',
    '8545',
    '--chain-id',
    String(params.chainId),
    '--block-base-fee-per-gas',
    '0',
  ]);
}

export function startNitroContainer(params: {
  containerName: string;
  networkName: string;
  rpcPort: number;
  runtimeDir: string;
  nitroImage: string;
  configFilePath: string;
  persistentChainPath: string;
}) {
  docker([
    'run',
    '-d',
    '--name',
    params.containerName,
    '--network',
    params.networkName,
    '-p',
    `${params.rpcPort}:8449`,
    '-v',
    `${params.runtimeDir}:/runtime`,
    params.nitroImage,
    '--conf.file',
    params.configFilePath,
    '--persistent.chain',
    params.persistentChainPath,
    '--ensure-rollup-deployment=false',
    '--init.validate-genesis-assertion=false',
    '--execution.parent-chain-reader.use-finality-data=false',
    '--execution.parent-chain-reader.poll-only=true',
    '--execution.parent-chain-reader.poll-interval=1s',
    '--execution.parent-chain-reader.poll-timeout=30s',
    '--node.parent-chain-reader.use-finality-data=false',
    '--node.parent-chain-reader.poll-only=true',
    '--node.parent-chain-reader.poll-interval=1s',
    '--node.parent-chain-reader.poll-timeout=30s',
    '--node.inbox-reader.check-delay=1s',
    '--node.delayed-sequencer.rescan-interval=1s',
    '--http.addr',
    '0.0.0.0',
    '--http.port',
    '8449',
    '--ws.addr',
    '0.0.0.0',
    '--ws.port',
    '8548',
    '--validation.wasm.enable-wasmroots-check=false',
  ]);
}
