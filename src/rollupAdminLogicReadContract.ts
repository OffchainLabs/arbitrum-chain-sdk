import {
  Address,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  PublicClient,
  ReadContractReturnType,
  Transport,
} from 'viem';
import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory';

export type RollupAdminLogicAbi = typeof RollupAdminLogic__factory.abi;
export type RollupAdminLogicReadFunctionName = ContractFunctionName<
  RollupAdminLogicAbi,
  'pure' | 'view'
>;

type RollupAdminLogicReadFunctionCall = {
  [K in RollupAdminLogicReadFunctionName]: readonly [] extends ContractFunctionArgs<
    RollupAdminLogicAbi,
    'pure' | 'view',
    K
  >
    ? {
        functionName: K;
        args?: ContractFunctionArgs<RollupAdminLogicAbi, 'pure' | 'view', K>;
      }
    : {
        functionName: K;
        args: ContractFunctionArgs<RollupAdminLogicAbi, 'pure' | 'view', K>;
      };
}[RollupAdminLogicReadFunctionName];

export type RollupAdminLogicReadContractParameters = RollupAdminLogicReadFunctionCall & {
  rollup: Address;
};

export type RollupAdminLogicReadContractReturnType = ReadContractReturnType<
  RollupAdminLogicAbi,
  RollupAdminLogicReadFunctionName
>;

export function rollupAdminLogicReadContract<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: RollupAdminLogicReadContractParameters,
): Promise<RollupAdminLogicReadContractReturnType> {
  return client.readContract({
    address: params.rollup,
    abi: RollupAdminLogic__factory.abi,
    functionName: params.functionName,
    args: params.args,
  });
}
