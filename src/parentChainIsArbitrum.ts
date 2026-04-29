import * as chains from './chains';
import { ParentChainId } from './types/ParentChain';

export function parentChainIsArbitrum(parentChainId: ParentChainId): boolean {
  // doing switch here to make sure it's exhaustive when checking against `ParentChainId`
  switch (parentChainId) {
    case chains.mainnet.id:
    case chains.base.id:
    case chains.sepolia.id:
    case chains.baseSepolia.id:
    case chains.nitroTestnodeL1.id:
      return false;

    case chains.arbitrumOne.id:
    case chains.arbitrumNova.id:
    case chains.arbitrumSepolia.id:
    case chains.nitroTestnodeL2.id:
      return true;
  }
}
