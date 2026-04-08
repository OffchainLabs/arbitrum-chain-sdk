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

function executeDockerCommand(
  argv: string[],
  environment: NodeJS.ProcessEnv,
): Promise<RunDockerCommandResult> {
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

function isMissingDockerImageError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const stderr = 'stderr' in error && typeof error.stderr === 'string' ? error.stderr : '';

  return (
    stderr.includes('No such object') ||
    stderr.includes('No such image') ||
    error.message.includes('No such object') ||
    error.message.includes('No such image')
  );
}

async function ensureDockerImageAvailable(image: string): Promise<void> {
  console.log(`Checking Docker image "${image}"...`);

  try {
    await executeDockerCommand(['docker', 'image', 'inspect', image], process.env);
    console.log(`Docker image "${image}" is already available locally.`);
    return;
  } catch (error) {
    if (!isMissingDockerImageError(error)) {
      throw error;
    }
  }

  console.log(`Docker image "${image}" is missing locally. Pulling it now...`);
  await executeDockerCommand(['docker', 'pull', image], process.env);
  console.log(`Docker image "${image}" was pulled successfully.`);
}

export async function runDockerCommand(
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

  await ensureDockerImageAvailable(params.image);

  return executeDockerCommand(argv, environment);
}
