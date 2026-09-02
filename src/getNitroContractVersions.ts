import type { Address } from 'viem';

import { runChainVersioner } from '@arbitrum/chain-actions';

export type GetNitroContractVersionsResult = {
  versions: Record<string, string | null>;
  upgradeRecommendation: unknown;
};

function parseNitroContractVersionsResult(
  result: string | GetNitroContractVersionsResult,
): GetNitroContractVersionsResult {
  const parsed =
    typeof result === 'string'
      ? (() => {
          try {
            return JSON.parse(result) as unknown;
          } catch {
            throw new Error('Failed to parse Nitro contract versions');
          }
        })()
      : result;

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('versions' in parsed) ||
    !('upgradeRecommendation' in parsed)
  ) {
    throw new Error('Failed to parse Nitro contract versions');
  }

  return parsed as GetNitroContractVersionsResult;
}

export async function getNitroContractVersions(
  inboxAddress: Address,
  parentChainRpc: string,
): Promise<GetNitroContractVersionsResult> {
  const result = await runChainVersioner(inboxAddress, parentChainRpc, true);

  return parseNitroContractVersionsResult(result);
}
