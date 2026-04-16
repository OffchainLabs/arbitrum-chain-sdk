import type { ExecFileException } from 'node:child_process';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}));

import { runDockerCommand } from './runDockerCommand';

describe('runDockerCommand', () => {
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    consoleLogSpy.mockClear();
    execFileMock.mockReset();
  });

  it('passes env values through the child process instead of the docker argv', async () => {
    execFileMock
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, '[]', '');
        return {} as never;
      })
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, 'ok', '');
        return {} as never;
      });

    const result = await runDockerCommand({
      image: 'offchainlabs/chain-actions',
      command: ['orbit:contracts:version'],
      env: {
        PARENT_CHAIN_RPC: 'https://rpc.example/my-secret-key',
      },
    });

    expect(execFileMock).toHaveBeenNthCalledWith(
      1,
      'docker',
      ['image', 'inspect', 'offchainlabs/chain-actions'],
      expect.objectContaining({
        env: process.env,
      }),
      expect.any(Function),
    );
    expect(execFileMock).toHaveBeenNthCalledWith(
      2,
      'docker',
      [
        'run',
        '--rm',
        '--env',
        'PARENT_CHAIN_RPC',
        'offchainlabs/chain-actions',
        'orbit:contracts:version',
      ],
      expect.objectContaining({
        env: expect.objectContaining({
          PARENT_CHAIN_RPC: 'https://rpc.example/my-secret-key',
        }),
      }),
      expect.any(Function),
    );
    expect(result).toEqual({
      argv: [
        'docker',
        'run',
        '--rm',
        '--env',
        'PARENT_CHAIN_RPC',
        'offchainlabs/chain-actions',
        'orbit:contracts:version',
      ],
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
    });
    expect(result.argv.join(' ')).not.toContain('my-secret-key');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Checking Docker image "offchainlabs/chain-actions"...',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Docker image "offchainlabs/chain-actions" is already available locally.',
    );
  });

  it('does not leak env values in failure metadata', async () => {
    execFileMock
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, '[]', '');
        return {} as never;
      })
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(
          Object.assign(new Error('Command failed'), {
            code: 17,
          }) as ExecFileException,
          '',
          'bad',
        );
        return {} as never;
      });

    const promise = runDockerCommand({
      image: 'offchainlabs/chain-actions',
      env: {
        PARENT_CHAIN_RPC: 'https://rpc.example/my-secret-key',
      },
    });

    const error = await promise.then(
      () => {
        throw new Error('Expected runDockerCommand to reject');
      },
      (rejection) =>
        rejection as Error & {
          name: string;
          argv: string[];
          stderr: string;
          exitCode: number;
        },
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'RunDockerCommandError',
      argv: ['docker', 'run', '--rm', '--env', 'PARENT_CHAIN_RPC', 'offchainlabs/chain-actions'],
      stderr: 'bad',
      exitCode: 17,
    });
    expect(error.message).not.toContain('my-secret-key');
    expect(error.argv.join(' ')).not.toContain('my-secret-key');
  });

  it('pulls missing images before running the container', async () => {
    execFileMock
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(
          Object.assign(new Error('Command failed'), {
            code: 1,
          }) as ExecFileException,
          '',
          'Error: No such object: offchainlabs/chain-actions',
        );
        return {} as never;
      })
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, 'Pulled', '');
        return {} as never;
      })
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, 'ok', '');
        return {} as never;
      });

    const result = await runDockerCommand({
      image: 'offchainlabs/chain-actions',
      command: ['orbit:contracts:version'],
    });

    expect(execFileMock).toHaveBeenNthCalledWith(
      1,
      'docker',
      ['image', 'inspect', 'offchainlabs/chain-actions'],
      expect.objectContaining({
        env: process.env,
      }),
      expect.any(Function),
    );
    expect(execFileMock).toHaveBeenNthCalledWith(
      2,
      'docker',
      ['pull', 'offchainlabs/chain-actions'],
      expect.objectContaining({
        env: process.env,
      }),
      expect.any(Function),
    );
    expect(execFileMock).toHaveBeenNthCalledWith(
      3,
      'docker',
      ['run', '--rm', 'offchainlabs/chain-actions', 'orbit:contracts:version'],
      expect.objectContaining({
        env: process.env,
      }),
      expect.any(Function),
    );
    expect(result).toEqual({
      argv: ['docker', 'run', '--rm', 'offchainlabs/chain-actions', 'orbit:contracts:version'],
      stdout: 'ok',
      stderr: '',
      exitCode: 0,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Docker image "offchainlabs/chain-actions" is missing locally. Pulling it now...',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Docker image "offchainlabs/chain-actions" was pulled successfully.',
    );
  });

  it('inserts additional docker run arguments before the image name', async () => {
    execFileMock
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, '[]', '');
        return {} as never;
      })
      .mockImplementationOnce((_file, _args, _options, callback) => {
        callback(null, 'ok', '');
        return {} as never;
      });

    const result = await runDockerCommand({
      image: 'offchainlabs/chain-actions',
      dockerRunArgs: ['--add-host', 'host.docker.internal:host-gateway'],
      command: ['orbit:contracts:version'],
    });

    expect(execFileMock).toHaveBeenNthCalledWith(
      2,
      'docker',
      [
        'run',
        '--rm',
        '--add-host',
        'host.docker.internal:host-gateway',
        'offchainlabs/chain-actions',
        'orbit:contracts:version',
      ],
      expect.objectContaining({
        env: process.env,
      }),
      expect.any(Function),
    );
    expect(result.argv).toEqual([
      'docker',
      'run',
      '--rm',
      '--add-host',
      'host.docker.internal:host-gateway',
      'offchainlabs/chain-actions',
      'orbit:contracts:version',
    ]);
  });
});
