import { Chain, GetFunctionArgs, PublicClient, ReadContractReturnType, Transport } from 'viem';

import { arbGasInfoABI, arbGasInfoAddress } from './contracts/ArbGasInfo';
import { GetFunctionName } from './types/utils';

export type ArbGasInfoAbi = typeof arbGasInfoABI;
export type ArbGasInfoFunctionName = GetFunctionName<ArbGasInfoAbi>;

export type ArbGasInfoReadContractParameters<TFunctionName extends ArbGasInfoFunctionName> = {
  functionName: TFunctionName;
} & GetFunctionArgs<ArbGasInfoAbi, TFunctionName>;

export type ArbGasInfoReadContractReturnType<TFunctionName extends ArbGasInfoFunctionName> =
  ReadContractReturnType<ArbGasInfoAbi, TFunctionName>;

export function arbGasInfoReadContract<
  TChain extends Chain | undefined,
  TFunctionName extends ArbGasInfoFunctionName,
>(
  client: PublicClient<Transport, TChain>,
  params: ArbGasInfoReadContractParameters<TFunctionName>,
): Promise<ArbGasInfoReadContractReturnType<TFunctionName>> {
  // @ts-expect-error -- todo: fix viem type issue
  return client.readContract({
    address: arbGasInfoAddress,
    abi: arbGasInfoABI,
    functionName: params.functionName,
    args: params.args,
  });
}
