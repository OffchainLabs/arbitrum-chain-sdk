import {
  PublicClient,
  encodeFunctionData,
  EncodeFunctionDataParameters,
  Address,
  Transport,
  Chain,
} from 'viem';

import { edgeChallengeManagerABI } from './contracts/EdgeChallengeManager';
import { GetFunctionName } from './types/utils';
import { validateParentChain } from './types/ParentChain';

export type EdgeChallengeManagerAbi = typeof edgeChallengeManagerABI;
export type EdgeChallengeManagerFunctionName = GetFunctionName<EdgeChallengeManagerAbi>;

type EdgeChallengeManagerEncodeFunctionDataParameters<
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = EncodeFunctionDataParameters<EdgeChallengeManagerAbi, TFunctionName>;

function edgeChallengeManagerEncodeFunctionData<
  TFunctionName extends EdgeChallengeManagerFunctionName,
>({ abi, functionName, args }: EdgeChallengeManagerEncodeFunctionDataParameters<TFunctionName>) {
  return encodeFunctionData({
    abi,
    functionName,
    args,
  });
}

export type EdgeChallengeManagerPrepareFunctionDataParameters<
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = EdgeChallengeManagerEncodeFunctionDataParameters<TFunctionName> & {
  abi: EdgeChallengeManagerAbi;
  challengeManager: Address;
};

export function edgeChallengeManagerPrepareFunctionData<
  TFunctionName extends EdgeChallengeManagerFunctionName,
>(params: EdgeChallengeManagerPrepareFunctionDataParameters<TFunctionName>) {
  return {
    to: params.challengeManager,
    data: edgeChallengeManagerEncodeFunctionData(
      params as EdgeChallengeManagerEncodeFunctionDataParameters<TFunctionName>,
    ),
    value: BigInt(0),
  };
}

export type EdgeChallengeManagerPrepareTransactionRequestParameters<
  TFunctionName extends EdgeChallengeManagerFunctionName,
> = Omit<EdgeChallengeManagerPrepareFunctionDataParameters<TFunctionName>, 'abi'> & {
  account: Address;
};

export async function edgeChallengeManagerPrepareTransactionRequest<
  TFunctionName extends EdgeChallengeManagerFunctionName,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(
  client: PublicClient<TTransport, TChain>,
  params: EdgeChallengeManagerPrepareTransactionRequestParameters<TFunctionName>,
) {
  const { chainId } = validateParentChain(client);

  const { to, data, value } = edgeChallengeManagerPrepareFunctionData({
    ...params,
    abi: edgeChallengeManagerABI,
  } as unknown as EdgeChallengeManagerPrepareFunctionDataParameters<TFunctionName>);

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
