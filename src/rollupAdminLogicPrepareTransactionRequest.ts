import {
  PublicClient,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  Address,
  Transport,
  Chain,
} from 'viem';

import { rollupABI } from './contracts/Rollup';

import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { GetFunctionName } from './types/utils';
import { validateParentChain } from './types/ParentChain';

export type RollupAdminLogicAbi = typeof rollupABI;
export type RollupAdminLogicFunctionName = GetFunctionName<RollupAdminLogicAbi>;

type RollupAdminLogicEncodeFunctionDataParameters<
  TFunctionName extends RollupAdminLogicFunctionName,
> = EncodeFunctionDataParameters<RollupAdminLogicAbi, TFunctionName>;

function rollupAdminLogicEncodeFunctionData<TFunctionName extends RollupAdminLogicFunctionName>({
  abi,
  functionName,
  args,
}: RollupAdminLogicEncodeFunctionDataParameters<TFunctionName>) {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
}

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
  const { upgradeExecutor } = params;

  if (!upgradeExecutor) {
    return {
      to: params.rollup,
      data: rollupAdminLogicEncodeFunctionData(
        params as RollupAdminLogicEncodeFunctionDataParameters<TFunctionName>,
      ),
      value: BigInt(0),
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        params.rollup, // target
        rollupAdminLogicEncodeFunctionData(
          params as RollupAdminLogicEncodeFunctionDataParameters<TFunctionName>,
        ), // targetCallData
      ],
    }),
    value: BigInt(0),
  };
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

  // params is extending RollupAdminLogicPrepareFunctionDataParameters, it's safe to cast
  const { to, data, value } = rollupAdminLogicPrepareFunctionData({
    ...params,
    abi: rollupABI,
  } as unknown as RollupAdminLogicPrepareFunctionDataParameters<TFunctionName>);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    to,
    data,
    value,
    account: params.account,
  });

  return { ...request, chainId };
}
