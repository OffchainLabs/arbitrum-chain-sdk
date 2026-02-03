import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbGasInfoABI, arbGasInfoAddress } from '../contracts/ArbGasInfo';

export type GetParentBaseFeeEstimateParameters = void;

export type GetParentBaseFeeEstimateReturnType = ReadContractReturnType<
  typeof arbGasInfoABI,
  'getL1BaseFeeEstimate'
>;

export async function getParentBaseFeeEstimate<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetParentBaseFeeEstimateReturnType> {
  return client.readContract({
    abi: arbGasInfoABI,
    functionName: 'getL1BaseFeeEstimate',
    address: arbGasInfoAddress,
  });
}
