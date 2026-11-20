import { PublicClient, Address, Transport, Chain } from 'viem';

import { rollupABI } from './contracts/Rollup';

import { GetFunctionName } from './types/utils';
import { validateParentChain } from './types/ParentChain';
import {
  ContractEncodeFunctionDataParameters,
  prepareContractCallParameters,
  prepareContractTransactionRequest,
} from './contractTransactionRequests';

export type RollupAdminLogicAbi = typeof rollupABI;
export type RollupAdminLogicFunctionName = GetFunctionName<RollupAdminLogicAbi>;

type RollupAdminLogicEncodeFunctionDataParameters<
  TFunctionName extends RollupAdminLogicFunctionName,
> = ContractEncodeFunctionDataParameters<RollupAdminLogicAbi, TFunctionName>;

export type RollupAdminLogicPrepareFunctionDataParameters<
  TFunctionName extends RollupAdminLogicFunctionName,
> = RollupAdminLogicEncodeFunctionDataParameters<TFunctionName> & {
  upgradeExecutor: Address | false;
  abi: RollupAdminLogicAbi;
  rollup: Address;
};

export function rollupAdminLogicPrepareFunctionData<
  TFunctionName extends RollupAdminLogicFunctionName,
>(params: RollupAdminLogicPrepareFunctionDataParameters<TFunctionName>) {
  return prepareContractCallParameters({
    ...params,
    to: params.rollup,
  });
}

export type RollupAdminLogicPrepareTransactionRequestParameters<
  TFunctionName extends RollupAdminLogicFunctionName,
> = Omit<RollupAdminLogicPrepareFunctionDataParameters<TFunctionName>, 'abi'> & {
  account: Address;
};

export async function rollupAdminLogicPrepareTransactionRequest<
  TFunctionName extends RollupAdminLogicFunctionName,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(
  client: PublicClient<TTransport, TChain>,
  params: RollupAdminLogicPrepareTransactionRequestParameters<TFunctionName>,
) {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest<RollupAdminLogicAbi, TFunctionName, TTransport, TChain>(
    client,
    {
      ...params,
      abi: rollupABI,
      to: params.rollup,
      chainId,
    },
  );
}
