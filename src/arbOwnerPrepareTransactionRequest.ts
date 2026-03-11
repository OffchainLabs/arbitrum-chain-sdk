import {
  PublicClient,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  Address,
  Chain,
  Transport,
} from 'viem';

import { arbOwnerABI, arbOwnerAddress } from './contracts/ArbOwner';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { GetFunctionName } from './types/utils';
import { TransactionRequestGasOverrides, applyPercentIncrease } from './utils/gasOverrides';

type ArbOwnerAbi = typeof arbOwnerABI;
export type ArbOwnerPrepareTransactionRequestFunctionName = GetFunctionName<ArbOwnerAbi>;
export type ArbOwnerEncodeFunctionDataParameters<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
> = EncodeFunctionDataParameters<ArbOwnerAbi, TFunctionName>;

function arbOwnerEncodeFunctionData<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
>({ functionName, abi, args }: ArbOwnerEncodeFunctionDataParameters<TFunctionName>) {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
}

export type ArbOwnerPrepareFunctionDataParameters<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
> = ArbOwnerEncodeFunctionDataParameters<TFunctionName> & {
  upgradeExecutor: Address | false;
  abi: ArbOwnerAbi;
};

export function arbOwnerPrepareFunctionData<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
>(params: ArbOwnerPrepareFunctionDataParameters<TFunctionName>) {
  const { upgradeExecutor } = params;

  if (!upgradeExecutor) {
    return {
      to: arbOwnerAddress,
      data: arbOwnerEncodeFunctionData(
        params as ArbOwnerEncodeFunctionDataParameters<TFunctionName>,
      ),
      value: BigInt(0),
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        arbOwnerAddress, // target
        arbOwnerEncodeFunctionData(params as ArbOwnerEncodeFunctionDataParameters<TFunctionName>), // targetCallData
      ],
    }),
    value: BigInt(0),
  };
}

export type ArbOwnerPrepareTransactionRequestParameters<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
> = Omit<ArbOwnerPrepareFunctionDataParameters<TFunctionName>, 'abi'> & {
  account: Address;
  gasOverrides?: TransactionRequestGasOverrides;
};

export async function arbOwnerPrepareTransactionRequest<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
  TChain extends Chain | undefined,
>(
  client: PublicClient<Transport, TChain>,
  params: ArbOwnerPrepareTransactionRequestParameters<TFunctionName>,
) {
  if (typeof client.chain === 'undefined') {
    throw new Error('[arbOwnerPrepareTransactionRequest] client.chain is undefined');
  }

  // params is extending ArbOwnerPrepareFunctionDataParameters, it's safe to cast
  const { to, data, value } = arbOwnerPrepareFunctionData({
    ...params,
    abi: arbOwnerABI,
  } as unknown as ArbOwnerPrepareFunctionDataParameters<TFunctionName>);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    to,
    data,
    value,
    account: params.account,
    // if the base gas limit override was provided, hardcode gas to 0 to skip estimation
    // we'll set the actual value in the code below
    gas: typeof params.gasOverrides?.gasLimit?.base !== 'undefined' ? 0n : undefined,
  });

  // potential gas overrides (gas limit)
  if (params.gasOverrides && params.gasOverrides.gasLimit) {
    request.gas = applyPercentIncrease({
      // the ! is here because we should let it error in case we don't have the estimated gas
      base: params.gasOverrides.gasLimit.base ?? request.gas!,
      percentIncrease: params.gasOverrides.gasLimit.percentIncrease,
    });
  }

  return { ...request, chainId: client.chain.id };
}
