import { execFile } from 'node:child_process';

export type RunDockerCommandParameters = {
  image: string;
  command?: string[];
  entrypoint?: string;
  env?: Record<string, string | undefined>;
};

export type RunDockerCommandResult = {
  argv: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
};

export function runDockerCommand(
  params: RunDockerCommandParameters,
): Promise<RunDockerCommandResult> {
  const envEntries = Object.entries(params.env ?? {}).filter((entry) => entry[1] !== undefined);

  const argv = [
    'docker',
    'run',
    '--rm',
    ...envEntries.flatMap(([name]) => ['--env', name]),
    ...(params.entrypoint ? ['--entrypoint', params.entrypoint] : []),
    params.image,
    ...(params.command ?? []),
  ];

  const environment = {
    ...process.env,
    ...Object.fromEntries(envEntries),
  };

  return new Promise((resolve, reject) => {
    execFile('docker', argv.slice(1), { env: environment }, (error, stdout, stderr) => {
      if (error) {
        return reject(
          Object.assign(new Error(`Docker command failed: ${error.message}`), {
            name: 'RunDockerCommandError',
            argv,
            stdout,
            stderr,
            exitCode: typeof error.code === 'number' ? error.code : 1,
            cause: error,
          }),
        );
      }

      resolve({
        argv,
        stdout,
        stderr,
        exitCode: 0,
      });
    });
  });
}
