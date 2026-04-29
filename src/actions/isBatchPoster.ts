import { Address, Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
import { ActionParameters } from '../types/Actions';

type Args = {
  batchPoster: Address;
};
export type IsBatchPosterParameters<Curried extends boolean = false> = ActionParameters<
  Args,
  'sequencerInbox',
  Curried
>;

export type IsBatchPosterReturnType = ReadContractReturnType<
  typeof sequencerInboxABI,
  'isBatchPoster'
>;

export async function isBatchPoster<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { sequencerInbox, params }: IsBatchPosterParameters,
): Promise<IsBatchPosterReturnType> {
  return client.readContract({
    abi: sequencerInboxABI,
    functionName: 'isBatchPoster',
    address: sequencerInbox,
    args: [params.batchPoster],
  });
}
