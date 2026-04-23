import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbOwnerPublicABI, arbOwnerPublicAddress } from '../contracts/ArbOwnerPublic';

export type GetAllChainOwnersParameters = void;

export type GetAllChainOwnersReturnType = ReadContractReturnType<
  typeof arbOwnerPublicABI,
  'getAllChainOwners'
>;

export async function getAllChainOwners<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetAllChainOwnersReturnType> {
  return client.readContract({
    abi: arbOwnerPublicABI,
    functionName: 'getAllChainOwners',
    address: arbOwnerPublicAddress,
  });
}
