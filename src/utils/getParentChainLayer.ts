import {
  mainnet,
  sepolia,
  nitroTestnodeL1,
  arbitrumOne,
  arbitrumNova,
  base,
  arbitrumSepolia,
  baseSepolia,
  nitroTestnodeL2,
} from '../chains';
import { ParentChainId } from '../types/ParentChain';

export function getParentChainLayer(parentChainId: ParentChainId): 1 | 2 {
  // doing switch here to make sure it's exhaustive when checking against `ParentChainId`
  switch (parentChainId) {
    // mainnet L1
    case mainnet.id:
    // testnet L1
    case sepolia.id:
    // local nitro-testnode L1
    case nitroTestnodeL1.id:
      return 1;

    // mainnet L2
    case arbitrumOne.id:
    case arbitrumNova.id:
    case base.id:
    // testnet L2
    case arbitrumSepolia.id:
    case baseSepolia.id:
    // local nitro-testnode L2
    case nitroTestnodeL2.id:
      return 2;
  }
}
