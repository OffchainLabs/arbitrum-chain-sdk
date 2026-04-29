import * as chains from './chains';
import { ParentChainId } from './types/ParentChain';

export function parentChainIsMainnet(parentChainId: ParentChainId): boolean {
  // doing switch here to make sure it's exhaustive when checking against `ParentChainId`
  switch (parentChainId) {
    case chains.mainnet.id:
    case chains.arbitrumOne.id:
    case chains.arbitrumNova.id:
    case chains.base.id:
      return true;

    case chains.sepolia.id:
    case chains.arbitrumSepolia.id:
    case chains.baseSepolia.id:
    case chains.nitroTestnodeL1.id:
    case chains.nitroTestnodeL2.id:
      return false;
  }
}
