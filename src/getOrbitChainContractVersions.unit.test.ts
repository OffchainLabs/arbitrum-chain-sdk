import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrbitChainContractVersions } from './getOrbitChainContractVersions';
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
      network: 'arb1',
      env: {
        PARENT_CHAIN_RPC: 'https://rpc.example',
      },
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: 'offchainlabs/chain-actions',
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
      network: 'arb-sepolia',
    });

    expect(runDockerCommand).toHaveBeenCalledWith({
      image: 'offchainlabs/chain-actions:custom',
      entrypoint: 'yarn',
      command: ['--silent', 'orbit:contracts:version', '--network', 'arb-sepolia', '--no-compile'],
      env: {
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
        network: 'arb1',
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
          network: 'arb1',
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
        network: 'arb1',
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
        network: 'arb1',
      }),
    ).resolves.toEqual({
      versions: 'not-validated',
      upgradeRecommendation: null,
    });
  });
});
