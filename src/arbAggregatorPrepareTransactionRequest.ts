import type { AbiStateMutability } from 'abitype';
import {
  PublicClient,
  encodeFunctionData,
  Address,
  Chain,
  Transport,
  ContractFunctionArgs,
  ContractFunctionName,
} from 'viem';

import { arbAggregatorABI, arbAggregatorAddress } from './contracts/ArbAggregator';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { PrepareTransactionRequestReturnTypeWithChainId } from './types/Actions';

type ArbAggregatorAbi = typeof arbAggregatorABI;
// ArbAggregator callers go through write entry points; narrow `TFunctionName` to the
// `nonpayable | payable` subset — viem v2 constrains contract-function generics to the
// function names that match the requested `stateMutability`.
type ArbAggregatorWriteMutability = 'nonpayable' | 'payable';
export type ArbAggregatorPrepareTransactionRequestFunctionName = ContractFunctionName<
  ArbAggregatorAbi,
  ArbAggregatorWriteMutability
>;

// Distributed union over every ArbAggregator write function. Each branch carries a
// concrete literal `functionName` + its matching `args` tuple so non-generic helpers that
// take this union can hand the fields to viem directly — viem's own correlated-union
// generic then resolves per-branch (microsoft/TypeScript#30581 is only triggered when
// `functionName` itself is still a generic).
type ArbAggregatorFunctionCall = {
  [K in ArbAggregatorPrepareTransactionRequestFunctionName]: {
    functionName: K;
    args: ContractFunctionArgs<ArbAggregatorAbi, AbiStateMutability, K>;
  };
}[ArbAggregatorPrepareTransactionRequestFunctionName];

export type ArbAggregatorPrepareTransactionRequestParameters = ArbAggregatorFunctionCall & {
  upgradeExecutor: Address | false;
  account: Address;
};

export async function arbAggregatorPrepareTransactionRequest<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: ArbAggregatorPrepareTransactionRequestParameters,
): Promise<PrepareTransactionRequestReturnTypeWithChainId> {
  if (typeof client.chain === 'undefined') {
    throw new Error('[arbAggregatorPrepareTransactionRequest] client.chain is undefined');
  }
  const chain: Chain = client.chain;

  const encoded = encodeFunctionData({
    abi: arbAggregatorABI,
    functionName: params.functionName,
    args: params.args,
  });

  const { to, data, value } = params.upgradeExecutor
    ? {
        to: params.upgradeExecutor,
        data: upgradeExecutorEncodeFunctionData({
          functionName: 'executeCall',
          args: [arbAggregatorAddress, encoded],
        }),
        value: BigInt(0),
      }
    : {
        to: arbAggregatorAddress,
        data: encoded,
        value: BigInt(0),
      };

  const request = await client.prepareTransactionRequest({
    chain,
    to,
    data,
    value,
    account: params.account,
    type: 'eip1559',
  });

  return { ...request, chainId: chain.id };
}
