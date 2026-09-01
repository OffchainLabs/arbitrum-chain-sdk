import type { Address } from 'viem';

import { runChainVersioner } from '@arbitrum/chain-actions';

import { verifyFoundryBinaries } from './utils/verifyFoundry';

export type GetChainContractVersionsResult = {
  versions: Record<string, string | null>;
  upgradeRecommendation: unknown;
};

function parseChainContractVersionsResult(
  result: string | GetChainContractVersionsResult,
): GetChainContractVersionsResult {
  const parsed =
    typeof result === 'string'
      ? (() => {
          try {
            return JSON.parse(result) as unknown;
          } catch {
            throw new Error('Failed to parse Orbit chain contract versions');
          }
        })()
      : result;

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('versions' in parsed) ||
    !('upgradeRecommendation' in parsed)
  ) {
    throw new Error('Failed to parse Orbit chain contract versions');
  }

  return parsed as GetChainContractVersionsResult;
}

export async function getChainContractVersions(
  inboxAddress: Address,
  parentChainRpc: string,
): Promise<GetChainContractVersionsResult> {
  await verifyFoundryBinaries();

  const result = await runChainVersioner(inboxAddress, parentChainRpc, true);

  return parseChainContractVersionsResult(result);
}
