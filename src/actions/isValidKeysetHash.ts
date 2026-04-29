import { Chain, Hex, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
import { ActionParameters } from '../types/Actions';

type Args = {
  keysetHash: Hex;
};

export type IsValidKeysetHashParameters<Curried extends boolean = false> = ActionParameters<
  Args,
  'sequencerInbox',
  Curried
>;

export type IsValidKeysetHashReturnType = ReadContractReturnType<
  typeof sequencerInboxABI,
  'isValidKeysetHash'
>;

export async function isValidKeysetHash<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { sequencerInbox, params }: IsValidKeysetHashParameters,
): Promise<IsValidKeysetHashReturnType> {
  return client.readContract({
    abi: sequencerInboxABI,
    functionName: 'isValidKeysetHash',
    address: sequencerInbox,
    args: [params.keysetHash],
  });
}
