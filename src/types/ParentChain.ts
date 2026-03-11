import { Client, Transport, Chain } from 'viem';

import { chains, getCustomParentChains, nitroTestnodeL3 } from '../chains';

// exclude nitro-testnode L3 from the list of parent chains
export type ParentChain = Exclude<(typeof chains)[number], { id: typeof nitroTestnodeL3.id }>;
export type ParentChainId = ParentChain['id'];

function isCustomParentChain(chainId: number): boolean {
  const ids = getCustomParentChains().map((chain) => chain.id);
  return ids.includes(chainId);
}

function isValidParentChainId(parentChainId: number | undefined): parentChainId is number {
  const ids = [...chains, ...getCustomParentChains()]
    // exclude nitro-testnode L3 from the list of parent chains
    .filter((chain) => chain.id !== nitroTestnodeL3.id)
    .map((chain) => chain.id) as number[];
  return ids.includes(Number(parentChainId));
}

export function validateParentChain<TChain extends Chain | undefined>(
  chainIdOrClient: number | Client<Transport, TChain>,
): { chainId: number; isCustom: true } | { chainId: ParentChainId; isCustom: false } {
  const chainId = typeof chainIdOrClient === 'number' ? chainIdOrClient : chainIdOrClient.chain?.id;

  if (!isValidParentChainId(chainId)) {
    throw new Error(`Parent chain not supported: ${chainId}`);
  }

  if (isCustomParentChain(chainId)) {
    return { chainId, isCustom: true };
  }

  return { chainId: chainId as ParentChainId, isCustom: false };
}
