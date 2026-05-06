import { execFile } from 'node:child_process';

const FOUNDRY_BINARIES: ['forge', 'cast'] = ['forge', 'cast'];

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

export async function verifyFoundryBinaries() {
  const results = await Promise.allSettled(
    FOUNDRY_BINARIES.map((binary) => runVersionCommand(binary)),
  );

  const binariesPresent = results.every((result) => result.status === 'fulfilled');

  const stableReleaseInstalled = results.every(
    (result) => result.status === 'fulfilled' && result.value.includes('-stable'),
  );

  return {
    binariesPresent,
    stableReleaseInstalled,
  };
}
