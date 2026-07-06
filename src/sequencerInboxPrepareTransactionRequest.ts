import { PublicClient, Address, Transport, Chain } from 'viem';

import { sequencerInboxABI } from './contracts/SequencerInbox';
import { GetFunctionName } from './types/utils';
import { validateParentChain } from './types/ParentChain';
import {
  ContractEncodeFunctionDataParameters,
  prepareContractCallParameters,
  prepareContractTransactionRequest,
} from './contractTransactionRequests';

export type SequencerInboxAbi = typeof sequencerInboxABI;
export type SequencerInboxFunctionName = GetFunctionName<SequencerInboxAbi>;

type SequencerInboxEncodeFunctionDataParameters<TFunctionName extends SequencerInboxFunctionName> =
  ContractEncodeFunctionDataParameters<SequencerInboxAbi, TFunctionName>;

export type SequencerInboxPrepareFunctionDataParameters<
  TFunctionName extends SequencerInboxFunctionName,
> = SequencerInboxEncodeFunctionDataParameters<TFunctionName> & {
  upgradeExecutor: Address | false;
  abi: SequencerInboxAbi;
  sequencerInbox: Address;
};

export function sequencerInboxPrepareFunctionData<TFunctionName extends SequencerInboxFunctionName>(
  params: SequencerInboxPrepareFunctionDataParameters<TFunctionName>,
) {
  return prepareContractCallParameters({
    ...params,
    to: params.sequencerInbox,
  });
}

export type SequencerInboxPrepareTransactionRequestParameters<
  TFunctionName extends SequencerInboxFunctionName,
> = Omit<SequencerInboxPrepareFunctionDataParameters<TFunctionName>, 'abi'> & {
  account: Address;
};

export async function sequencerInboxPrepareTransactionRequest<
  TFunctionName extends SequencerInboxFunctionName,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(
  client: PublicClient<TTransport, TChain>,
  params: SequencerInboxPrepareTransactionRequestParameters<TFunctionName>,
) {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest<SequencerInboxAbi, TFunctionName, TTransport, TChain>(
    client,
    {
      ...params,
      abi: sequencerInboxABI,
      to: params.sequencerInbox,
      chainId,
    },
  );
}
