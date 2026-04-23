import type { AbiStateMutability } from 'abitype';
import {
  PublicClient,
  encodeFunctionData,
  Address,
  Transport,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
} from 'viem';

import { rollupABI } from './contracts/Rollup';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { PrepareTransactionRequestReturnTypeWithChainId } from './types/Actions';
import { validateParentChain } from './types/ParentChain';

export type RollupAdminLogicAbi = typeof rollupABI;
// RollupAdminLogic callers go through write entry points; narrow `TFunctionName` to the
// `nonpayable | payable` subset — viem v2 constrains contract-function generics to the
// function names that match the requested `stateMutability`.
type RollupAdminLogicWriteMutability = 'nonpayable' | 'payable';
export type RollupAdminLogicFunctionName = ContractFunctionName<
  RollupAdminLogicAbi,
  RollupAdminLogicWriteMutability
>;

// Distributed union over every RollupAdminLogic write function. Each branch carries a
// concrete literal `functionName` + its matching `args` tuple so non-generic helpers that
// take this union can hand the fields to viem directly — viem's own correlated-union
// generic then resolves per-branch (microsoft/TypeScript#30581 is only triggered when
// `functionName` itself is still a generic).
type RollupAdminLogicFunctionCall = {
  [K in RollupAdminLogicFunctionName]: {
    functionName: K;
    args: ContractFunctionArgs<RollupAdminLogicAbi, AbiStateMutability, K>;
  };
}[RollupAdminLogicFunctionName];

// Public parameter shape for `rollupAdminLogicPrepareFunctionData`. Accepts the
// distributed union directly so callers get concrete-literal inference per branch.
export type RollupAdminLogicPrepareFunctionDataParameters = RollupAdminLogicFunctionCall & {
  upgradeExecutor: Address | false;
  abi: RollupAdminLogicAbi;
  rollup: Address;
};

export function rollupAdminLogicPrepareFunctionData(
  params: RollupAdminLogicPrepareFunctionDataParameters,
) {
  const encoded = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
  });

  if (!params.upgradeExecutor) {
    return {
      to: params.rollup,
      data: encoded,
      value: BigInt(0),
    };
  }

  return {
    to: params.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        params.rollup, // target
        encoded, // targetCallData
      ],
    }),
    value: BigInt(0),
  };
}

export type RollupAdminLogicPrepareTransactionRequestParameters = RollupAdminLogicFunctionCall & {
  upgradeExecutor: Address | false;
  rollup: Address;
  account: Address;
};

export async function rollupAdminLogicPrepareTransactionRequest<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: RollupAdminLogicPrepareTransactionRequestParameters,
): Promise<PrepareTransactionRequestReturnTypeWithChainId> {
  const { chainId } = validateParentChain(client);
  if (client.chain === undefined) {
    throw new Error('[rollupAdminLogicPrepareTransactionRequest] client.chain is undefined');
  }
  const chain: Chain = client.chain;

  const { to, data, value } = rollupAdminLogicPrepareFunctionData({
    ...params,
    abi: rollupABI,
  });

  const request = await client.prepareTransactionRequest({
    chain,
    to,
    data,
    value,
    account: params.account,
    type: 'eip1559',
  });

  return { ...request, chainId };
}
