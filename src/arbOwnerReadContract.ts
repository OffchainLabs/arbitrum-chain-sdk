import { Chain, GetFunctionArgs, PublicClient, ReadContractReturnType, Transport } from 'viem';

import { arbOwnerPublicABI, arbOwnerPublicAddress } from './contracts/ArbOwnerPublic';
import { GetFunctionName } from './types/utils';

export type ArbOwnerPublicAbi = typeof arbOwnerPublicABI;
export type ArbOwnerPublicFunctionName = GetFunctionName<ArbOwnerPublicAbi>;

export type ArbOwnerReadContractParameters<TFunctionName extends ArbOwnerPublicFunctionName> = {
  functionName: TFunctionName;
} & GetFunctionArgs<ArbOwnerPublicAbi, TFunctionName>;

export type ArbOwnerReadContractReturnType<TFunctionName extends ArbOwnerPublicFunctionName> =
  ReadContractReturnType<ArbOwnerPublicAbi, TFunctionName>;

export function arbOwnerReadContract<
  TChain extends Chain | undefined,
  TFunctionName extends ArbOwnerPublicFunctionName,
>(
  client: PublicClient<Transport, TChain>,
  params: ArbOwnerReadContractParameters<TFunctionName>,
): Promise<ArbOwnerReadContractReturnType<TFunctionName>> {
  // @ts-expect-error -- todo: fix viem type issue
  return client.readContract({
    address: arbOwnerPublicAddress,
    abi: arbOwnerPublicABI,
    functionName: params.functionName,
    args: params.args,
  });
}
