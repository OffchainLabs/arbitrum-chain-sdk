import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrbitChainContractVersions } from './getOrbitChainContractVersions';
import { DEFAULT_ORBIT_ACTIONS_IMAGE } from './constants';
import { runDockerCommand } from './runDockerCommand';

vi.mock('./runDockerCommand', () => ({
  runDockerCommand: vi.fn(),
}));

describe('getOrbitChainContractVersions', () => {
  beforeEach(() => {
    vi.mocked(runDockerCommand).mockReset();
  });

  it('uses the default Orbit Actions image through the internal docker runner', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","RollupProxy":"v1.1.1"},"upgradeRecommendation":{"message":"No upgrade path found"}}',
      stderr: '',
      exitCode: 0,
    });

    const result = await getOrbitChainContractVersions({
      inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      networkOrChainId: 'arb1',
      parentChainRpc: 'https://rpc.example',
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: DEFAULT_ORBIT_ACTIONS_IMAGE,
      entrypoint: 'yarn',
      command: ['--silent', 'orbit:contracts:version', '--network', 'arb1', '--no-compile'],
      env: {
        PARENT_CHAIN_RPC: 'https://rpc.example',
        INBOX_ADDRESS: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        JSON_OUTPUT: 'true',
      },
    });

    expect(result).toEqual({
      versions: {
        Inbox: 'v1.1.1',
        RollupProxy: 'v1.1.1',
      },
      upgradeRecommendation: {
        message: 'No upgrade path found',
      },
    });
  });

  it('uses a custom Orbit Actions image when one is provided', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","Bridge":"v1.1.2","RollupProxy":null},"upgradeRecommendation":null}',
      stderr: '',
      exitCode: 0,
    });

    const result = await getOrbitChainContractVersions({
      image: 'offchainlabs/chain-actions:custom',
      inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      networkOrChainId: 'arb-sepolia',
      parentChainRpc: 'https://arb-sepolia.example/rpc',
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: 'offchainlabs/chain-actions:custom',
      entrypoint: 'yarn',
      command: ['--silent', 'orbit:contracts:version', '--network', 'arb-sepolia', '--no-compile'],
      env: {
        PARENT_CHAIN_RPC: 'https://arb-sepolia.example/rpc',
        INBOX_ADDRESS: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        JSON_OUTPUT: 'true',
      },
    });

    expect(result).toEqual({
      versions: {
        Inbox: 'v1.1.1',
        Bridge: 'v1.1.2',
        RollupProxy: null,
      },
      upgradeRecommendation: null,
    });
  });

  it('accepts a numeric network chain id and uses the generic fork network', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","RollupProxy":"v1.1.1"},"upgradeRecommendation":{"message":"No upgrade path found"}}',
      stderr: '',
      exitCode: 0,
    });

    await getOrbitChainContractVersions({
      inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      networkOrChainId: 42161,
      parentChainRpc: 'https://arb1.example/rpc',
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: DEFAULT_ORBIT_ACTIONS_IMAGE,
      entrypoint: 'yarn',
      command: ['--silent', 'orbit:contracts:version', '--network', 'fork', '--no-compile'],
      env: {
        PARENT_CHAIN_RPC: 'https://arb1.example/rpc',
        FORK_URL: 'https://arb1.example/rpc',
        INBOX_ADDRESS: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        JSON_OUTPUT: 'true',
      },
    });
  });

  it('accepts a decimal string network chain id and makes local RPCs reachable from Docker', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","RollupProxy":"v1.1.1"},"upgradeRecommendation":{"message":"No upgrade path found"}}',
      stderr: '',
      exitCode: 0,
    });

    await getOrbitChainContractVersions({
      inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      networkOrChainId: '42161',
      parentChainRpc: 'http://127.0.0.1:8545',
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: DEFAULT_ORBIT_ACTIONS_IMAGE,
      entrypoint: 'yarn',
      dockerRunArgs: ['--add-host', 'host.docker.internal:host-gateway'],
      command: ['--silent', 'orbit:contracts:version', '--network', 'fork', '--no-compile'],
      env: {
        PARENT_CHAIN_RPC: 'http://host.docker.internal:8545/',
        FORK_URL: 'http://host.docker.internal:8545/',
        INBOX_ADDRESS: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        JSON_OUTPUT: 'true',
      },
    });
  });

  it('rewrites a local RPC for non-fork docker runs too', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","RollupProxy":"v1.1.1"},"upgradeRecommendation":{"message":"No upgrade path found"}}',
      stderr: '',
      exitCode: 0,
    });

    await getOrbitChainContractVersions({
      inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      networkOrChainId: 'arb1',
      parentChainRpc: 'http://localhost:8545',
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: DEFAULT_ORBIT_ACTIONS_IMAGE,
      entrypoint: 'yarn',
      dockerRunArgs: ['--add-host', 'host.docker.internal:host-gateway'],
      command: ['--silent', 'orbit:contracts:version', '--network', 'arb1', '--no-compile'],
      env: {
        PARENT_CHAIN_RPC: 'http://host.docker.internal:8545/',
        INBOX_ADDRESS: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        JSON_OUTPUT: 'true',
      },
    });
  });

  it('throws when the docker output does not contain a valid JSON payload', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout: 'not json',
      stderr: '',
      exitCode: 0,
    });

    await expect(
      getOrbitChainContractVersions({
        inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        networkOrChainId: 'arb1',
        parentChainRpc: 'https://rpc.example',
      }),
    ).rejects.toThrow('Failed to parse Orbit chain contract versions');
  });

  it.each(['null', '"unexpected"', '42', 'true', '[]'])(
    'throws when the parsed JSON payload is not an object: %s',
    async (stdout) => {
      vi.mocked(runDockerCommand).mockResolvedValueOnce({
        argv: ['docker', 'run'],
        stdout,
        stderr: '',
        exitCode: 0,
      });

      await expect(
        getOrbitChainContractVersions({
          inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
          networkOrChainId: 'arb1',
          parentChainRpc: 'https://rpc.example',
        }),
      ).rejects.toThrow('Failed to parse Orbit chain contract versions');
    },
  );

  it('throws when the JSON payload is missing top level fields', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout: '{"versions":{"Inbox":"v1.1.1"}}',
      stderr: '',
      exitCode: 0,
    });

    await expect(
      getOrbitChainContractVersions({
        inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        networkOrChainId: 'arb1',
        parentChainRpc: 'https://rpc.example',
      }),
    ).rejects.toThrow('Failed to parse Orbit chain contract versions');
  });

  it('accepts any JSON payload that includes versions and upgradeRecommendation', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout: '{"versions":"not-validated","upgradeRecommendation":null}',
      stderr: '',
      exitCode: 0,
    });

    await expect(
      getOrbitChainContractVersions({
        inboxAddress: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        networkOrChainId: 'arb1',
        parentChainRpc: 'https://rpc.example',
      }),
    ).resolves.toEqual({
      versions: 'not-validated',
      upgradeRecommendation: null,
    });
  });
});
