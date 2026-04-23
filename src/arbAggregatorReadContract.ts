import {
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  PublicClient,
  ReadContractReturnType,
  Transport,
} from 'viem';

import { arbAggregatorABI, arbAggregatorAddress } from './contracts/ArbAggregator';

export type ArbAggregatorAbi = typeof arbAggregatorABI;
export type ArbAggregatorReadFunctionName = ContractFunctionName<ArbAggregatorAbi, 'pure' | 'view'>;

type ArbAggregatorReadFunctionCall = {
  [K in ArbAggregatorReadFunctionName]: readonly [] extends ContractFunctionArgs<
    ArbAggregatorAbi,
    'pure' | 'view',
    K
  >
    ? {
        functionName: K;
        args?: ContractFunctionArgs<ArbAggregatorAbi, 'pure' | 'view', K>;
      }
    : {
        functionName: K;
        args: ContractFunctionArgs<ArbAggregatorAbi, 'pure' | 'view', K>;
      };
}[ArbAggregatorReadFunctionName];

export type ArbAggregatorReadContractParameters = ArbAggregatorReadFunctionCall;

export type ArbAggregatorReadContractReturnType = ReadContractReturnType<
  ArbAggregatorAbi,
  ArbAggregatorReadFunctionName
>;

export function arbAggregatorReadContract<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: ArbAggregatorReadContractParameters,
): Promise<ArbAggregatorReadContractReturnType> {
  return client.readContract({
    address: arbAggregatorAddress,
    abi: arbAggregatorABI,
    functionName: params.functionName,
    args: params.args,
  });
}
