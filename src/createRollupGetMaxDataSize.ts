import {
  mainnet,
  arbitrumOne,
  arbitrumNova,
  base,
  sepolia,
  arbitrumSepolia,
  baseSepolia,
  nitroTestnodeL1,
  nitroTestnodeL2,
} from './chains';
import { ParentChainId } from './types/ParentChain';

export function createRollupGetMaxDataSize(parentChainId: ParentChainId): bigint {
  // doing switch here to make sure it's exhaustive when checking against `ParentChainId`
  switch (parentChainId) {
    // mainnet L1
    case mainnet.id:
    // testnet L1
    case sepolia.id:
    // local nitro-testnode L1
    case nitroTestnodeL1.id:
      return BigInt(117_964);

    // mainnet L2
    case arbitrumOne.id:
    case arbitrumNova.id:
    case base.id:
    // testnet L2
    case arbitrumSepolia.id:
    case baseSepolia.id:
    // local nitro-testnode L2
    case nitroTestnodeL2.id:
      return BigInt(104_857);
  }
}
