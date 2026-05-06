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

export type VerifyFoundryBinariesParams = {
  throwIfMissing?: boolean;
};

export async function verifyFoundryBinaries({
  throwIfMissing = true,
}: VerifyFoundryBinariesParams = {}) {
  const results = await Promise.allSettled(
    FOUNDRY_BINARIES.map((binary) => runVersionCommand(binary)),
  );

  const binariesPresent = results.every((result) => result.status === 'fulfilled');

  const stableReleaseInstalled = results.every(
    (result) => result.status === 'fulfilled' && result.value.includes('-stable'),
  );

  if (throwIfMissing && !binariesPresent) {
    throw new Error(
      'Foundry is required to run this operation. Install Foundry and make sure forge and cast are available on PATH.',
    );
  }

  return {
    binariesPresent,
    stableReleaseInstalled,
  };
}
