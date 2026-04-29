import { ParentChainId } from './types/ParentChain';
import { base, baseSepolia } from './chains';

export function getParentChainBlockTime(parentChainId: ParentChainId) {
  const parentChainIsOpStack = parentChainId === base.id || parentChainId === baseSepolia.id;
  // For Arbitrum L2s built on top of Ethereum, or Arbitrum L3s built on top of an Arbitrum L2, `block.number` always returns the L1 block number.
  // L1 blocks are produced every 12 seconds.
  //
  // For Arbitrum L3s built on top of an OP Stack L2, `block.number` will return the L2 block number.
  // L2 blocks in OP Stack chains are produced every 2 seconds.
  return parentChainIsOpStack ? 2 : 12;
}
