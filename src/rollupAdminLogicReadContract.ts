import {
  Address,
  Chain,
  GetFunctionArgs,
  PublicClient,
  ReadContractParameters,
  ReadContractReturnType,
  Transport,
} from 'viem';
import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory';

import { GetFunctionName } from './types/utils';
import { rollupABI } from './contracts/Rollup';

export type RollupAdminLogicAbi = typeof rollupABI;
export type RollupAdminLogicFunctionName = GetFunctionName<RollupAdminLogicAbi>;

export type RollupAdminLogicReadContractParameters<
  TFunctionName extends RollupAdminLogicFunctionName,
> = {
  functionName: TFunctionName;
  rollup: Address;
} & GetFunctionArgs<RollupAdminLogicAbi, TFunctionName>;

export type RollupAdminLogicReadContractReturnType<
  TFunctionName extends RollupAdminLogicFunctionName,
> = ReadContractReturnType<RollupAdminLogicAbi, TFunctionName>;

export function rollupAdminLogicReadContract<
  TChain extends Chain | undefined,
  TFunctionName extends RollupAdminLogicFunctionName,
>(
  client: PublicClient<Transport, TChain>,
  params: RollupAdminLogicReadContractParameters<TFunctionName>,
): Promise<RollupAdminLogicReadContractReturnType<TFunctionName>> {
  return client.readContract({
    address: params.rollup,
    abi: RollupAdminLogic__factory.abi,
    functionName: params.functionName,
    args: params.args,
  } as unknown as ReadContractParameters<RollupAdminLogicAbi, TFunctionName>);
}
