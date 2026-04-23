import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbGasInfoABI, arbGasInfoAddress } from '../contracts/ArbGasInfo';

export type GetParentRewardRateParameters = void;

export type GetParentRewardRateReturnType = ReadContractReturnType<
  typeof arbGasInfoABI,
  'getL1RewardRate'
>;

export async function getParentRewardRate<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetParentRewardRateReturnType> {
  return client.readContract({
    abi: arbGasInfoABI,
    functionName: 'getL1RewardRate',
    address: arbGasInfoAddress,
  });
}
