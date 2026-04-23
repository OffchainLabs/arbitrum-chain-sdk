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

import { sequencerInboxABI } from './contracts/SequencerInbox';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { PrepareTransactionRequestReturnTypeWithChainId } from './types/Actions';
import { validateParentChain } from './types/ParentChain';

export type SequencerInboxAbi = typeof sequencerInboxABI;
// SequencerInbox callers go through write entry points; narrow `TFunctionName` to the
// `nonpayable | payable` subset — viem v2 constrains contract-function generics to the
// function names that match the requested `stateMutability`.
type SequencerInboxWriteMutability = 'nonpayable' | 'payable';
export type SequencerInboxFunctionName = ContractFunctionName<
  SequencerInboxAbi,
  SequencerInboxWriteMutability
>;

// Distributed union over every SequencerInbox write function. Each branch carries a
// concrete literal `functionName` + its matching `args` tuple so non-generic helpers that
// take this union can hand the fields to viem directly — viem's own correlated-union
// generic then resolves per-branch (microsoft/TypeScript#30581 is only triggered when
// `functionName` itself is still a generic).
type SequencerInboxFunctionCall = {
  [K in SequencerInboxFunctionName]: {
    functionName: K;
    args: ContractFunctionArgs<SequencerInboxAbi, AbiStateMutability, K>;
  };
}[SequencerInboxFunctionName];

// Public parameter shape for `sequencerInboxPrepareFunctionData`. Accepts the distributed
// union directly so callers get concrete-literal inference per branch.
export type SequencerInboxPrepareFunctionDataParameters = SequencerInboxFunctionCall & {
  upgradeExecutor: Address | false;
  abi: SequencerInboxAbi;
  sequencerInbox: Address;
};

export function sequencerInboxPrepareFunctionData(
  params: SequencerInboxPrepareFunctionDataParameters,
) {
  const encoded = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args,
  });

  if (!params.upgradeExecutor) {
    return {
      to: params.sequencerInbox,
      data: encoded,
      value: BigInt(0),
    };
  }

  return {
    to: params.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        params.sequencerInbox, // target
        encoded, // targetCallData
      ],
    }),
    value: BigInt(0),
  };
}

export type SequencerInboxPrepareTransactionRequestParameters = SequencerInboxFunctionCall & {
  upgradeExecutor: Address | false;
  sequencerInbox: Address;
  account: Address;
};

export async function sequencerInboxPrepareTransactionRequest<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  params: SequencerInboxPrepareTransactionRequestParameters,
): Promise<PrepareTransactionRequestReturnTypeWithChainId> {
  const { chainId } = validateParentChain(client);
  if (client.chain === undefined) {
    throw new Error('[sequencerInboxPrepareTransactionRequest] client.chain is undefined');
  }
  const chain: Chain = client.chain;

  const { to, data, value } = sequencerInboxPrepareFunctionData({
    ...params,
    abi: sequencerInboxABI,
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
