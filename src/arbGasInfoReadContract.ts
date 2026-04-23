import {
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  PublicClient,
  ReadContractReturnType,
  Transport,
} from 'viem';

import { arbGasInfoABI, arbGasInfoAddress } from './contracts/ArbGasInfo';

export type ArbGasInfoAbi = typeof arbGasInfoABI;
export type ArbGasInfoReadFunctionName = ContractFunctionName<ArbGasInfoAbi, 'pure' | 'view'>;

type ArbGasInfoReadFunctionCall = {
  [K in ArbGasInfoReadFunctionName]: readonly [] extends ContractFunctionArgs<
    ArbGasInfoAbi,
    'pure' | 'view',
    K
  >
    ? {
        functionName: K;
        args?: ContractFunctionArgs<ArbGasInfoAbi, 'pure' | 'view', K>;
      }
    : {
        functionName: K;
        args: ContractFunctionArgs<ArbGasInfoAbi, 'pure' | 'view', K>;
      };
}[ArbGasInfoReadFunctionName];

export type ArbGasInfoReadContractParameters = ArbGasInfoReadFunctionCall;

export type ArbGasInfoReadContractReturnType = ReadContractReturnType<
  ArbGasInfoAbi,
  ArbGasInfoReadFunctionName
>;

export function arbGasInfoReadContract<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: ArbGasInfoReadContractParameters,
): Promise<ArbGasInfoReadContractReturnType> {
  return client.readContract({
    address: arbGasInfoAddress,
    abi: arbGasInfoABI,
    functionName: params.functionName,
    args: params.args,
  });
}
