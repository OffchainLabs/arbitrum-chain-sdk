import {
  PublicClient,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  Address,
  Chain,
  Transport,
} from 'viem';

import { arbAggregatorABI, arbAggregatorAddress } from './contracts/ArbAggregator';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { GetFunctionName } from './types/utils';

type ArbAggregatorAbi = typeof arbAggregatorABI;
export type ArbAggregatorPrepareTransactionRequestFunctionName = GetFunctionName<ArbAggregatorAbi>;
export type ArbAggregatorEncodeFunctionDataParameters<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
> = EncodeFunctionDataParameters<ArbAggregatorAbi, TFunctionName>;

function arbAggregatorEncodeFunctionData<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
>({ functionName, abi, args }: ArbAggregatorEncodeFunctionDataParameters<TFunctionName>) {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
}

export type ArbAggregatorPrepareFunctionDataParameters<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
> = ArbAggregatorEncodeFunctionDataParameters<TFunctionName> & {
  upgradeExecutor: Address | false;
  abi: ArbAggregatorAbi;
};

export function arbAggregatorPrepareFunctionData<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
>(params: ArbAggregatorPrepareFunctionDataParameters<TFunctionName>) {
  const { upgradeExecutor } = params;

  if (!upgradeExecutor) {
    return {
      to: arbAggregatorAddress,
      data: arbAggregatorEncodeFunctionData(
        params as ArbAggregatorEncodeFunctionDataParameters<TFunctionName>,
      ),
      value: BigInt(0),
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        arbAggregatorAddress, // target
        arbAggregatorEncodeFunctionData(
          params as ArbAggregatorEncodeFunctionDataParameters<TFunctionName>,
        ), // targetCallData
      ],
    }),
    value: BigInt(0),
  };
}

export type ArbAggregatorPrepareTransactionRequestParameters<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
> = Omit<ArbAggregatorPrepareFunctionDataParameters<TFunctionName>, 'abi'> & {
  account: Address;
};
export async function arbAggregatorPrepareTransactionRequest<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
  TChain extends Chain | undefined,
>(
  client: PublicClient<Transport, TChain>,
  params: ArbAggregatorPrepareTransactionRequestParameters<TFunctionName>,
) {
  if (typeof client.chain === 'undefined') {
    throw new Error('[arbAggregatorPrepareTransactionRequest] client.chain is undefined');
  }

  // params is extending ArbAggregatorPrepareFunctionDataParameters, it's safe to cast
  const { to, data, value } = arbAggregatorPrepareFunctionData({
    ...params,
    abi: arbAggregatorABI,
  } as unknown as ArbAggregatorPrepareFunctionDataParameters<TFunctionName>);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    to,
    data,
    value,
    account: params.account,
  });

  return { ...request, chainId: client.chain.id };
}
