import { Chain, extractChain } from 'viem';

import { validateParentChain } from '../types/ParentChain';
import { chains, getCustomParentChains } from '../chains';

export function getParentChainFromId(chainId: number): Chain {
  const { chainId: parentChainId } = validateParentChain(chainId);

  // Custom chains first: a registered custom chain wins over a built-in with the same id,
  // so its factory addresses are used instead of the contract-less built-in entry.
  return extractChain({
    chains: [...getCustomParentChains(), ...chains],
    id: parentChainId,
  });
}
