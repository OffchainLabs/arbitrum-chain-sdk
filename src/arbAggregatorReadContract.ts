import { Chain, GetFunctionArgs, PublicClient, ReadContractReturnType, Transport } from 'viem';

import { arbAggregatorABI, arbAggregatorAddress } from './contracts/ArbAggregator';
import { GetFunctionName } from './types/utils';

export type ArbAggregatorAbi = typeof arbAggregatorABI;
export type ArbAggregatorFunctionName = GetFunctionName<ArbAggregatorAbi>;

export type ArbAggregatorReadContractParameters<TFunctionName extends ArbAggregatorFunctionName> = {
  functionName: TFunctionName;
} & GetFunctionArgs<ArbAggregatorAbi, TFunctionName>;

export type ArbAggregatorReadContractReturnType<TFunctionName extends ArbAggregatorFunctionName> =
  ReadContractReturnType<ArbAggregatorAbi, TFunctionName>;

export function arbAggregatorReadContract<
  TChain extends Chain | undefined,
  TFunctionName extends ArbAggregatorFunctionName,
>(
  client: PublicClient<Transport, TChain>,
  params: ArbAggregatorReadContractParameters<TFunctionName>,
): Promise<ArbAggregatorReadContractReturnType<TFunctionName>> {
  // @ts-expect-error -- todo: fix viem type issue
  return client.readContract({
    address: arbAggregatorAddress,
    abi: arbAggregatorABI,
    functionName: params.functionName,
    args: params.args,
  });
}
