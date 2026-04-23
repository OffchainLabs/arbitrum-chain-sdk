import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbOwnerPublicABI, arbOwnerPublicAddress } from '../contracts/ArbOwnerPublic';

export type GetNetworkFeeAccountParameters = void;

export type GetNetworkFeeAccountReturnType = ReadContractReturnType<
  typeof arbOwnerPublicABI,
  'getNetworkFeeAccount'
>;

export async function getNetworkFeeAccount<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetNetworkFeeAccountReturnType> {
  return client.readContract({
    abi: arbOwnerPublicABI,
    functionName: 'getNetworkFeeAccount',
    address: arbOwnerPublicAddress,
  });
}
