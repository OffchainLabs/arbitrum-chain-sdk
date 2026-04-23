import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbOwnerPublicABI, arbOwnerPublicAddress } from '../contracts/ArbOwnerPublic';

export type GetInfraFeeAccountParameters = void;

export type GetInfraFeeAccountReturnType = ReadContractReturnType<
  typeof arbOwnerPublicABI,
  'getInfraFeeAccount'
>;

export async function getInfraFeeAccount<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetInfraFeeAccountReturnType> {
  return client.readContract({
    abi: arbOwnerPublicABI,
    functionName: 'getInfraFeeAccount',
    address: arbOwnerPublicAddress,
  });
}
