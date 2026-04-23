import {
  Address,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  PublicClient,
  ReadContractReturnType,
  Transport,
} from 'viem';

import { sequencerInboxABI } from './contracts/SequencerInbox';

export type SequencerInboxAbi = typeof sequencerInboxABI;
export type SequencerInboxReadFunctionName = ContractFunctionName<
  SequencerInboxAbi,
  'pure' | 'view'
>;

type SequencerInboxReadFunctionCall = {
  [K in SequencerInboxReadFunctionName]: readonly [] extends ContractFunctionArgs<
    SequencerInboxAbi,
    'pure' | 'view',
    K
  >
    ? {
        functionName: K;
        args?: ContractFunctionArgs<SequencerInboxAbi, 'pure' | 'view', K>;
      }
    : {
        functionName: K;
        args: ContractFunctionArgs<SequencerInboxAbi, 'pure' | 'view', K>;
      };
}[SequencerInboxReadFunctionName];

export type SequencerInboxReadContractParameters = SequencerInboxReadFunctionCall & {
  sequencerInbox: Address;
};

export type SequencerInboxReadContractReturnType = ReadContractReturnType<
  SequencerInboxAbi,
  SequencerInboxReadFunctionName
>;

export function sequencerInboxReadContract<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: SequencerInboxReadContractParameters,
): Promise<SequencerInboxReadContractReturnType> {
  return client.readContract({
    address: params.sequencerInbox,
    abi: sequencerInboxABI,
    functionName: params.functionName,
    args: params.args,
  });
}
