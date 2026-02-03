import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbGasInfoABI, arbGasInfoAddress } from '../contracts/ArbGasInfo';

export type GetParentRewardRecipientParameters = void;

export type GetParentRewardRecipientReturnType = ReadContractReturnType<
  typeof arbGasInfoABI,
  'getL1RewardRecipient'
>;

export async function getParentRewardRecipient<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetParentRewardRecipientReturnType> {
  return client.readContract({
    abi: arbGasInfoABI,
    functionName: 'getL1RewardRecipient',
    address: arbGasInfoAddress,
  });
}
