import { Client, Transport, Chain } from 'viem';

import { ParentChainId, validateParentChain } from './types/ParentChain';
import { parentChainIsMainnet } from './parentChainIsMainnet';
import { getParentChainBlockTime } from './getParentChainBlockTime';

export function getDefaultConfirmPeriodBlocks<TChain extends Chain | undefined>(
  parentChainIdOrClient: ParentChainId | Client<Transport, TChain>,
): bigint {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } =
    validateParentChain(parentChainIdOrClient);

  if (parentChainIsCustom) {
    throw new Error(
      `[getDefaultConfirmPeriodBlocks] can't provide defaults for custom parent chain with id ${parentChainId}`,
    );
  }

  const isMainnet = parentChainIsMainnet(parentChainId);
  const blocksPerMinute = 60 / getParentChainBlockTime(parentChainId);

  return isMainnet
    ? // 7 days
      BigInt(7 * 24 * 60 * blocksPerMinute)
    : // 30 minutes
      BigInt(30 * blocksPerMinute);
}
