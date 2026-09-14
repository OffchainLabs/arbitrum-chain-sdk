import { PublicClient, Address, Chain, Transport } from 'viem';

import { arbOwnerABI, arbOwnerAddress } from './contracts/ArbOwner';
import { GetFunctionName } from './types/utils';
import { TransactionRequestGasOverrides, applyPercentIncrease } from './utils/gasOverrides';
import {
  ContractEncodeFunctionDataParameters,
  prepareContractCallParameters,
  prepareContractTransactionRequest,
} from './contractTransactionRequests';

type ArbOwnerAbi = typeof arbOwnerABI;
export type ArbOwnerPrepareTransactionRequestFunctionName = GetFunctionName<ArbOwnerAbi>;
export type ArbOwnerEncodeFunctionDataParameters<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
> = ContractEncodeFunctionDataParameters<ArbOwnerAbi, TFunctionName>;

export type ArbOwnerPrepareFunctionDataParameters<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
> = ArbOwnerEncodeFunctionDataParameters<TFunctionName> & {
  upgradeExecutor: Address | false;
  abi: ArbOwnerAbi;
};

export function arbOwnerPrepareFunctionData<
  TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
>(params: ArbOwnerPrepareFunctionDataParameters<TFunctionName>) {
  return prepareContractCallParameters({
    ...params,
    to: arbOwnerAddress,
  });
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

  const request = await prepareContractTransactionRequest<
    ArbOwnerAbi,
    TFunctionName,
    Transport,
    TChain
  >(client, {
    ...params,
    abi: arbOwnerABI,
    to: arbOwnerAddress,
    chainId: client.chain.id,
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

  return request;
}
