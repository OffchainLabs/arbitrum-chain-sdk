import { Chain, extractChain } from 'viem';

import { validateParentChain } from '../types/ParentChain';
import { chains, getCustomParentChains } from '../chains';

export function getParentChainFromId(chainId: number): Chain {
  const { chainId: parentChainId } = validateParentChain(chainId);

  return extractChain({
    chains: [...chains, ...getCustomParentChains()],
    id: parentChainId,
  });
}
