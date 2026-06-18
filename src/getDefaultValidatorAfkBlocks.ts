import { Client, Transport, Chain } from 'viem';

import { ParentChainId, validateParentChain } from './types/ParentChain';
import { getParentChainBlockTime } from './getParentChainBlockTime';

export function getDefaultValidatorAfkBlocks<TChain extends Chain | undefined>(
  parentChainIdOrClient: ParentChainId | Client<Transport, TChain>,
): bigint {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } =
    validateParentChain(parentChainIdOrClient);

  if (parentChainIsCustom) {
    throw new Error(
      `[getDefaultValidatorAfkBlocks] can't provide defaults for custom parent chain with id ${parentChainId}`,
    );
  }

  const blocksPerMinute = 60 / getParentChainBlockTime(parentChainId);

  // https://github.com/OffchainLabs/nitro-contracts/blob/main/src/rollup/RollupAdminLogic.sol#L58-L60
  //
  // 28 days
  //
  // Since it can take 14 days under normal circumstances to confirm an assertion, this means
  // the validators will have been inactive for a further 14 days before the whitelist is removed.
  return BigInt(28 * 24 * 60 * blocksPerMinute);
}
