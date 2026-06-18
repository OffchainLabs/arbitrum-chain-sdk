import { Client, Transport, Chain } from 'viem';

import { ParentChainId, validateParentChain } from './types/ParentChain';
import { getParentChainBlockTime } from './getParentChainBlockTime';

export function getDefaultMinimumAssertionPeriod<TChain extends Chain | undefined>(
  parentChainIdOrClient: ParentChainId | Client<Transport, TChain>,
): bigint {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } =
    validateParentChain(parentChainIdOrClient);

  if (parentChainIsCustom) {
    throw new Error(
      `[getDefaultMinimumAssertionPeriod] can't provide defaults for custom parent chain with id ${parentChainId}`,
    );
  }

  const blocksPerMinute = 60 / getParentChainBlockTime(parentChainId);

  // 15 minutes
  return BigInt(15 * blocksPerMinute);
}
