import type { Address } from 'viem';

import { runDockerCommand } from './runDockerCommand';
import { DEFAULT_ORBIT_ACTIONS_IMAGE } from './constants';

export type GetOrbitChainContractVersionsParameters = {
  image?: string;
  inboxAddress: Address;
  network: string;
  env?: Record<string, string | undefined>;
};

export type GetOrbitChainContractVersionsResult = {
  versions: Record<string, string | null>;
  upgradeRecommendation: unknown;
};

export async function getOrbitChainContractVersions({
  image = DEFAULT_ORBIT_ACTIONS_IMAGE,
  inboxAddress,
  network,
  env,
}: GetOrbitChainContractVersionsParameters): Promise<GetOrbitChainContractVersionsResult> {
  const { stdout } = await runDockerCommand({
    image,
    entrypoint: 'yarn',
    command: ['--silent', 'orbit:contracts:version', '--network', network, '--no-compile'],
    env: {
      ...env,
      INBOX_ADDRESS: inboxAddress,
      JSON_OUTPUT: 'true',
    },
  });

  let parsed: unknown;

  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch {
    throw new Error('Failed to parse Orbit chain contract versions');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('versions' in parsed) ||
    !('upgradeRecommendation' in parsed)
  ) {
    throw new Error('Failed to parse Orbit chain contract versions');
  }

  return parsed as GetOrbitChainContractVersionsResult;
}
