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
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it('passes env values through the child process instead of the docker argv', async () => {
    execFileMock.mockImplementationOnce((_file, _args, _options, callback) => {
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

    expect(execFileMock).toHaveBeenCalledWith(
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
  });

  it('does not leak env values in failure metadata', async () => {
    execFileMock.mockImplementationOnce((_file, _args, _options, callback) => {
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
});
