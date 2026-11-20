import { PublicClient, Address, Chain, Transport } from 'viem';

import { arbAggregatorABI, arbAggregatorAddress } from './contracts/ArbAggregator';
import { GetFunctionName } from './types/utils';
import {
  ContractEncodeFunctionDataParameters,
  prepareContractCallParameters,
  prepareContractTransactionRequest,
} from './contractTransactionRequests';

type ArbAggregatorAbi = typeof arbAggregatorABI;
export type ArbAggregatorPrepareTransactionRequestFunctionName = GetFunctionName<ArbAggregatorAbi>;
export type ArbAggregatorEncodeFunctionDataParameters<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
> = ContractEncodeFunctionDataParameters<ArbAggregatorAbi, TFunctionName>;

export type ArbAggregatorPrepareFunctionDataParameters<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
> = ArbAggregatorEncodeFunctionDataParameters<TFunctionName> & {
  upgradeExecutor: Address | false;
  abi: ArbAggregatorAbi;
};

export function arbAggregatorPrepareFunctionData<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
>(params: ArbAggregatorPrepareFunctionDataParameters<TFunctionName>) {
  return prepareContractCallParameters({
    ...params,
    to: arbAggregatorAddress,
  });
}

export type ArbAggregatorPrepareTransactionRequestParameters<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
> = Omit<ArbAggregatorPrepareFunctionDataParameters<TFunctionName>, 'abi'> & {
  account: Address;
};
export async function arbAggregatorPrepareTransactionRequest<
  TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
  TChain extends Chain | undefined,
>(
  client: PublicClient<Transport, TChain>,
  params: ArbAggregatorPrepareTransactionRequestParameters<TFunctionName>,
) {
  if (typeof client.chain === 'undefined') {
    throw new Error('[arbAggregatorPrepareTransactionRequest] client.chain is undefined');
  }

  return prepareContractTransactionRequest<ArbAggregatorAbi, TFunctionName, Transport, TChain>(
    client,
    {
      ...params,
      abi: arbAggregatorABI,
      to: arbAggregatorAddress,
      chainId: client.chain.id,
    },
  );
}
