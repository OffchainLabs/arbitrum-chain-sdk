import { Chain, PublicClient, Transport } from 'viem';
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
} from '../chains';
import { validateParentChain } from '../types/ParentChain';

const earliestRollupCreatorDeploymentBlockNumber: Record<number, bigint> = {
  // mainnet L1
  [mainnet.id]: 18_736_164n,
  // mainnet L2
  [arbitrumOne.id]: 150_599_584n,
  [arbitrumNova.id]: 47_798_739n,
  [base.id]: 12_978_604n,
  // testnet L1
  [sepolia.id]: 4_741_823n,
  // testnet L2
  [arbitrumSepolia.id]: 654_628n,
  [baseSepolia.id]: 10_606_961n,
  // local nitro-testnode
  [nitroTestnodeL1.id]: 0n,
  [nitroTestnodeL2.id]: 0n,
};

export function getEarliestRollupCreatorDeploymentBlockNumber<TChain extends Chain | undefined>(
  publicClient: PublicClient<Transport, TChain>,
) {
  const { chainId, isCustom } = validateParentChain(publicClient);

  if (isCustom) {
    return 0n;
  }

  return earliestRollupCreatorDeploymentBlockNumber[chainId];
}
