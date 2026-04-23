import type { AbiStateMutability } from 'abitype';
import {
  PublicClient,
  encodeFunctionData,
  Address,
  Chain,
  ContractFunctionArgs,
  ContractFunctionName,
  Transport,
} from 'viem';

import { arbOwnerABI, arbOwnerAddress } from './contracts/ArbOwner';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { PrepareTransactionRequestReturnTypeWithChainId } from './types/Actions';
import { TransactionRequestGasOverrides, applyPercentIncrease } from './utils/gasOverrides';

type ArbOwnerAbi = typeof arbOwnerABI;
// ArbOwner callers always go through a write entry point, so narrow `TFunctionName` to the
// `nonpayable | payable` subset — viem v2 constrains contract-function generics to the
// function names that match the requested `stateMutability`.
type ArbOwnerWriteMutability = 'nonpayable' | 'payable';
export type ArbOwnerPrepareTransactionRequestFunctionName = ContractFunctionName<
  ArbOwnerAbi,
  ArbOwnerWriteMutability
>;

// Distributed union over every ArbOwner write function. Each branch carries a concrete
// literal `functionName` + its matching `args` tuple. Non-generic helpers that take this
// union can hand the fields to viem directly — viem's own correlated-union generic then
// resolves per-branch (microsoft/TypeScript#30581 is only triggered when `functionName`
// itself is still a generic).
type ArbOwnerFunctionCall = {
  [K in ArbOwnerPrepareTransactionRequestFunctionName]: {
    functionName: K;
    args: ContractFunctionArgs<ArbOwnerAbi, AbiStateMutability, K>;
  };
}[ArbOwnerPrepareTransactionRequestFunctionName];

// Public entry point. Accepts the `ArbOwnerFunctionCall` distributed union directly so
// callers get concrete-literal inference per function name from the union branch they
// pick — and we avoid the generic correlated-union limitation inside the wrapper body
// (microsoft/TypeScript#30581).
export type ArbOwnerPrepareTransactionRequestFullParams = ArbOwnerFunctionCall & {
  upgradeExecutor: Address | false;
  account: Address;
  gasOverrides?: TransactionRequestGasOverrides;
};

export async function arbOwnerPrepareTransactionRequest<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: ArbOwnerPrepareTransactionRequestFullParams,
): Promise<PrepareTransactionRequestReturnTypeWithChainId> {
  if (client.chain === undefined) {
    throw new Error('[arbOwnerPrepareTransactionRequest] client.chain is undefined');
  }
  const chain: Chain = client.chain;

  const encoded = encodeFunctionData({
    abi: arbOwnerABI,
    functionName: params.functionName,
    args: params.args,
  });
  const { to, data, value } = params.upgradeExecutor
    ? {
        to: params.upgradeExecutor,
        data: upgradeExecutorEncodeFunctionData({
          functionName: 'executeCall',
          args: [arbOwnerAddress, encoded],
        }),
        value: BigInt(0),
      }
    : {
        to: arbOwnerAddress,
        data: encoded,
        value: BigInt(0),
      };

  const request = await client.prepareTransactionRequest({
    chain,
    to,
    data,
    value,
    account: params.account,
    // Pin the transaction type to the EIP-1559 branch so the return matches
    // `PrepareTransactionRequestReturnTypeWithChainId` and exposes `gas`.
    type: 'eip1559',
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

  return { ...request, chainId: chain.id };
}
