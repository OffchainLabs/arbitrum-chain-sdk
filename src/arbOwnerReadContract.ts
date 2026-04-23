import {
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  PublicClient,
  ReadContractReturnType,
  Transport,
} from 'viem';

import { arbOwnerPublicABI, arbOwnerPublicAddress } from './contracts/ArbOwnerPublic';

export type ArbOwnerPublicAbi = typeof arbOwnerPublicABI;
export type ArbOwnerReadFunctionName = ContractFunctionName<ArbOwnerPublicAbi, 'pure' | 'view'>;

type ArbOwnerReadFunctionCall = {
  [K in ArbOwnerReadFunctionName]: readonly [] extends ContractFunctionArgs<
    ArbOwnerPublicAbi,
    'pure' | 'view',
    K
  >
    ? {
        functionName: K;
        args?: ContractFunctionArgs<ArbOwnerPublicAbi, 'pure' | 'view', K>;
      }
    : {
        functionName: K;
        args: ContractFunctionArgs<ArbOwnerPublicAbi, 'pure' | 'view', K>;
      };
}[ArbOwnerReadFunctionName];

export type ArbOwnerReadContractParameters = ArbOwnerReadFunctionCall;

export type ArbOwnerReadContractReturnType = ReadContractReturnType<
  ArbOwnerPublicAbi,
  ArbOwnerReadFunctionName
>;

export function arbOwnerReadContract<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: ArbOwnerReadContractParameters,
): Promise<ArbOwnerReadContractReturnType> {
  return client.readContract({
    address: arbOwnerPublicAddress,
    abi: arbOwnerPublicABI,
    functionName: params.functionName,
    args: params.args,
  });
}
