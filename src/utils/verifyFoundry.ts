import { execFile } from 'node:child_process';

const FOUNDRY_BINARIES = ['forge', 'cast'] as const;

function runVersionCommand(binary: 'forge' | 'cast'): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(binary, ['--version'], (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}

export async function verifyFoundryBinaries(stableOnly = true) {
  const results = await Promise.allSettled(
    FOUNDRY_BINARIES.map((binary) => runVersionCommand(binary)),
  );

  const binariesPresent = results.every((result) => result.status === 'fulfilled');

  const stableReleaseInstalled = results.every(
    (result) =>
      result.status === 'fulfilled' && result.value && isStableFoundryRelease(result.value),
  );

  if (!binariesPresent) {
    throw new Error(
      'Foundry is required to run this operation. Install Foundry and make sure forge and cast are available on PATH.',
    );
  }

  if (stableOnly && !stableReleaseInstalled) {
    throw new Error(
      'Foundry stable releases are required to run this operation. Please install the stable versions of forge and cast.',
    );
  }
}

function isStableFoundryRelease(version: string): boolean {
  return !['nightly', 'dev', 'alpha', 'beta', 'rc', 'preview'].some((tag) =>
    version.toLowerCase().includes(tag),
  );
}
