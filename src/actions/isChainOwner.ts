import { Address, Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbOwnerPublicABI, arbOwnerPublicAddress } from '../contracts/ArbOwnerPublic';

export type IsChainOwnerParameters = {
  address: Address;
};

export type IsChainOwnerReturnType = ReadContractReturnType<
  typeof arbOwnerPublicABI,
  'isChainOwner'
>;

export async function isChainOwner<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: IsChainOwnerParameters,
): Promise<IsChainOwnerReturnType> {
  return client.readContract({
    abi: arbOwnerPublicABI,
    functionName: 'isChainOwner',
    address: arbOwnerPublicAddress,
    args: [args.address],
  });
}
