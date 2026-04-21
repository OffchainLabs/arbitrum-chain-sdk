import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_ORBIT_ACTIONS_IMAGE } from './constants';
import { getOrbitChainContractVersions } from './getOrbitChainContractVersions';
import { runDockerCommand } from './runDockerCommand';
import { runOrbitVersioner } from 'orbit-actions';

vi.mock('./runDockerCommand', () => ({
  runDockerCommand: vi.fn(),
}));

vi.mock('orbit-actions', () => ({
  runOrbitVersioner: vi.fn(),
}));

describe('getOrbitChainContractVersions', () => {
  beforeEach(() => {
    vi.mocked(runDockerCommand).mockReset();
    vi.mocked(runOrbitVersioner).mockReset();
  });

  it('uses the native orbit-actions versioner by default', async () => {
    vi.mocked(runOrbitVersioner).mockResolvedValueOnce({
      versions: {
        Inbox: 'v1.1.1',
        RollupProxy: 'v1.1.1',
      },
      upgradeRecommendation: {
        message: 'No upgrade path found',
      },
    });

    await expect(
      getOrbitChainContractVersions(
        '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        'https://rpc.example',
      ),
    ).resolves.toEqual({
      versions: {
        Inbox: 'v1.1.1',
        RollupProxy: 'v1.1.1',
      },
      upgradeRecommendation: {
        message: 'No upgrade path found',
      },
    });

    expect(runOrbitVersioner).toHaveBeenCalledWith(
      '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      'https://rpc.example',
      true,
    );
    expect(runDockerCommand).not.toHaveBeenCalled();
  });

  it('uses a custom Orbit Actions image when docker mode is requested', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","Bridge":"v1.1.2","RollupProxy":null},"upgradeRecommendation":null}',
      stderr: '',
      exitCode: 0,
    });

    await expect(
      getOrbitChainContractVersions(
        '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        'https://arb-sepolia.example/rpc',
        'docker',
        'offchainlabs/chain-actions:custom',
      ),
    ).resolves.toEqual({
      versions: {
        Inbox: 'v1.1.1',
        Bridge: 'v1.1.2',
        RollupProxy: null,
      },
      upgradeRecommendation: null,
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: 'offchainlabs/chain-actions:custom',
      entrypoint: 'yarn',
      command: ['--silent', 'orbit:contracts:version'],
      env: {
        PARENT_CHAIN_RPC: 'https://arb-sepolia.example/rpc',
        INBOX_ADDRESS: '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        JSON_OUTPUT: 'true',
      },
    });
  });

  it('rewrites a local RPC so Docker can reach the host', async () => {
    vi.mocked(runDockerCommand).mockResolvedValueOnce({
      argv: ['docker', 'run'],
      stdout:
        '{"versions":{"Inbox":"v1.1.1","RollupProxy":"v1.1.1"},"upgradeRecommendation":{"message":"No upgrade path found"}}',
      stderr: '',
      exitCode: 0,
    });

    await getOrbitChainContractVersions(
      '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
      'http://127.0.0.1:8545',
      'docker',
    );

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: DEFAULT_ORBIT_ACTIONS_IMAGE,
      entrypoint: 'yarn',
      dockerRunArgs: ['--add-host', 'host.docker.internal:host-gateway'],
      command: ['--silent', 'orbit:contracts:version'],
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
      getOrbitChainContractVersions(
        '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        'https://rpc.example',
        'docker',
      ),
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
        getOrbitChainContractVersions(
          '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
          'https://rpc.example',
          'docker',
        ),
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
      getOrbitChainContractVersions(
        '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        'https://rpc.example',
        'docker',
      ),
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
      getOrbitChainContractVersions(
        '0xaE21fDA3de92dE2FDAF606233b2863782Ba046F9',
        'https://rpc.example',
        'docker',
      ),
    ).resolves.toEqual({
      versions: 'not-validated',
      upgradeRecommendation: null,
    });
  });
});
