import { execFile, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createPublicClient, http } from 'viem';

import { testConstants } from './constants';

const cachedNitroContractsImageByTag: Record<string, string> = {};

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

function sanitizeDockerTagPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

export function getNitroContractsImage(): string {
  const imageTag = `chain-sdk-nitro-contracts:${sanitizeDockerTagPart(
    testConstants.DEFAULT_NITRO_CONTRACTS_REF,
  )}`;
  const cachedImage = cachedNitroContractsImageByTag[imageTag];
  if (cachedImage) {
    return cachedImage;
  }

  try {
    docker(['image', 'inspect', imageTag]);
  } catch {
    const tempDir = mkdtempSync(join(tmpdir(), 'chain-sdk-nitro-contracts-'));
    const repoDir = join(tempDir, 'repo');
    const dockerfilePath = join(process.cwd(), 'nitro-contracts', 'Dockerfile');

    try {
      runCommand('git', [
        'clone',
        '--recurse-submodules',
        '--shallow-submodules',
        '--depth',
        '1',
        '--branch',
        testConstants.DEFAULT_NITRO_CONTRACTS_BRANCH,
        '--single-branch',
        testConstants.DEFAULT_NITRO_CONTRACTS_REPO_URL,
        repoDir,
      ]);

      docker(['build', '-f', dockerfilePath, '-t', imageTag, repoDir]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  cachedNitroContractsImageByTag[imageTag] = imageTag;
  return imageTag;
}

export function createSourceDockerNetwork(networkName: string) {
  docker(['network', 'create', networkName]);
}

export async function waitForRpc(params: { rpcUrl: string; timeoutMs: number }) {
  const { rpcUrl, timeoutMs } = params;
  const publicClient = createPublicClient({ transport: http(rpcUrl) });
  const deadline = Date.now() + timeoutMs;

  const poll = async (): Promise<void> => {
    try {
      await publicClient.getChainId();
      return;
    } catch {
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for RPC ${rpcUrl}`);
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
  l2ContainerName?: string;
  l1ContainerName?: string;
  dockerNetworkName?: string;
  runtimeDir?: string;
}) {
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
    const ids = docker(['ps', '-aq', '--filter', 'name=^chain-sdk-int-test-(l1|l2)-']);
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

export function startSourceL1AnvilContainer(params: {
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
    '--block-time',
    '1',
  ]);
}

export function startSourceL2NitroContainer(params: {
  containerName: string;
  networkName: string;
  l2RpcPort: number;
  runtimeDir: string;
  nitroImage: string;
}) {
  docker([
    'run',
    '-d',
    '--name',
    params.containerName,
    '--network',
    params.networkName,
    '-p',
    `${params.l2RpcPort}:8449`,
    '-v',
    `${params.runtimeDir}:/runtime`,
    params.nitroImage,
    '--conf.file',
    '/runtime/source-l2-node-config.json',
    '--persistent.chain',
    '/runtime/nitro-data',
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
