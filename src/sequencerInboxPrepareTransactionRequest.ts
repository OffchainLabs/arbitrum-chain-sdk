import {
  PublicClient,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  Address,
  Transport,
  Chain,
} from 'viem';

import { sequencerInboxABI } from './contracts/SequencerInbox';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { GetFunctionName } from './types/utils';
import { validateParentChain } from './types/ParentChain';

export type SequencerInboxAbi = typeof sequencerInboxABI;
export type SequencerInboxFunctionName = GetFunctionName<SequencerInboxAbi>;

type SequencerInboxEncodeFunctionDataParameters<TFunctionName extends SequencerInboxFunctionName> =
  EncodeFunctionDataParameters<SequencerInboxAbi, TFunctionName>;

function sequencerInboxEncodeFunctionData<TFunctionName extends SequencerInboxFunctionName>({
  abi,
  functionName,
  args,
}: SequencerInboxEncodeFunctionDataParameters<TFunctionName>) {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
}

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
  const { upgradeExecutor } = params;

  if (!upgradeExecutor) {
    return {
      to: params.sequencerInbox,
      data: sequencerInboxEncodeFunctionData(
        params as SequencerInboxEncodeFunctionDataParameters<TFunctionName>,
      ),
      value: BigInt(0),
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        params.sequencerInbox, // target
        sequencerInboxEncodeFunctionData(
          params as SequencerInboxEncodeFunctionDataParameters<TFunctionName>,
        ), // targetCallData
      ],
    }),
    value: BigInt(0),
  };
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

  // params is extending SequencerInboxPrepareFunctionDataParameters, it's safe to cast
  const { to, data, value } = sequencerInboxPrepareFunctionData({
    ...params,
    abi: sequencerInboxABI,
  } as unknown as SequencerInboxPrepareFunctionDataParameters<TFunctionName>);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    to,
    data,
    value,
    account: params.account,
  });

  return { ...request, chainId };
}
