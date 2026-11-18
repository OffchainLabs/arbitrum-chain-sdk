import { spawn } from 'node:child_process';

import { verifyFoundryBinaries } from './verifyFoundry';

export type RunForgeScriptParameters = {
  script: string;
  rpcUrl: string;
  cwd?: string;
  forgeArgs?: string[];
  env?: Record<string, string | undefined>;
};

export type RunForgeScriptResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

/** Runs a Forge script after verifying that Foundry is installed. */
export async function runForgeScript({
  script,
  rpcUrl,
  cwd,
  forgeArgs = [],
  env = {},
}: RunForgeScriptParameters): Promise<RunForgeScriptResult> {
  await verifyFoundryBinaries();

  const args = ['script', script, '--rpc-url', rpcUrl, ...forgeArgs];
  const environment = {
    ...process.env,
    ...Object.fromEntries(
      Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
    ),
  };

  return new Promise((resolve, reject) => {
    const child = spawn('forge', args, {
      cwd,
      env: environment,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.once('error', (cause) => {
      reject(
        Object.assign(new Error(`Unable to start Forge script: ${cause.message}`), {
          name: 'RunForgeScriptError',
          stdout,
          stderr,
          exitCode: 1,
          cause,
        }),
      );
    });

    child.once('close', (exitCode, signal) => {
      if (exitCode !== 0) {
        const reason = signal ? `signal ${signal}` : `exit code ${exitCode ?? 1}`;
        reject(
          Object.assign(new Error(`Forge script failed with ${reason}`), {
            name: 'RunForgeScriptError',
            stdout,
            stderr,
            exitCode: exitCode ?? 1,
          }),
        );
        return;
      }

      resolve({ stdout, stderr, exitCode });
    });
  });
}
