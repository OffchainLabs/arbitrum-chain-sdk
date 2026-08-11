import type { Address, Abi, Hex } from 'viem';
import { encodeFunctionData } from 'viem';
import { formatAbiItem } from 'viem/utils';
import type { AbiFunction } from 'abitype';

import { upgradeExecutorABI } from '../contracts/UpgradeExecutor';
import { toPublicClient, findOrDefineChain } from './viemTransforms';

export type ParsedContractCommand = {
  rpcUrl: string;
  chainId: number;
  address: Address;
  function: string;
  args: readonly unknown[];
  account?: Address;
  upgradeExecutor?: Address;
  value?: bigint;
};

function findAbiFunction(abi: Abi, signature: string): AbiFunction {
  for (const e of abi) {
    if (e.type === 'function' && formatAbiItem(e) === signature) return e;
  }
  throw new Error(`Function ${JSON.stringify(signature)} not found in ABI`);
}

export async function runContractCommand({
  abi,
  parsed,
}: {
  abi: Abi;
  parsed: ParsedContractCommand;
}): Promise<unknown> {
  const fn = findAbiFunction(abi, parsed.function);
  const client = toPublicClient(parsed.rpcUrl, findOrDefineChain(parsed.chainId, parsed.rpcUrl));

  if (fn.stateMutability === 'view' || fn.stateMutability === 'pure') {
    return client.readContract({
      abi: [fn],
      address: parsed.address,
      functionName: fn.name,
      args: parsed.args,
    } as Parameters<typeof client.readContract>[0]);
  }

  const callData: Hex = encodeFunctionData({
    abi: [fn],
    functionName: fn.name,
    args: parsed.args,
  } as Parameters<typeof encodeFunctionData>[0]);

  const { to, data } = parsed.upgradeExecutor
    ? {
        to: parsed.upgradeExecutor,
        data: encodeFunctionData({
          abi: upgradeExecutorABI,
          functionName: 'executeCall',
          args: [parsed.address, callData],
        }),
      }
    : { to: parsed.address, data: callData };

  return client.prepareTransactionRequest({
    chain: client.chain,
    account: parsed.account!,
    to,
    data,
    value: parsed.value,
  });
}
