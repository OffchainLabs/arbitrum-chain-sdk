import type { Address, Abi, Hex } from 'viem';
import { encodeFunctionData } from 'viem';
import type { AbiFunction } from 'abitype';

import { upgradeExecutorABI } from '../contracts/UpgradeExecutor';
import { toPublicClient, findChain } from './viemTransforms';

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

function bareName(key: string): string {
  const paren = key.indexOf('(');
  return paren === -1 ? key : key.slice(0, paren);
}

function findAbiFunction(abi: Abi, key: string): AbiFunction {
  const name = bareName(key);
  const candidates = abi.filter((e): e is AbiFunction => e.type === 'function' && e.name === name);
  if (candidates.length === 0) {
    throw new Error(`Function ${JSON.stringify(key)} not found in ABI`);
  }
  if (candidates.length === 1) return candidates[0];
  // Overloaded — disambiguate by full canonical signature.
  const match = candidates.find((fn) => {
    const sig = `${fn.name}(${fn.inputs.map((p) => p.type).join(',')})`;
    return sig === key;
  });
  if (!match) {
    throw new Error(`Overloaded function ${JSON.stringify(key)} did not match any ABI entry`);
  }
  return match;
}

export async function runContractCommand({
  abi,
  parsed,
}: {
  abi: Abi;
  parsed: ParsedContractCommand;
}): Promise<unknown> {
  const fn = findAbiFunction(abi, parsed.function);
  const functionName = fn.name;
  const args = parsed.args as readonly unknown[];

  const client = toPublicClient(parsed.rpcUrl, findChain(parsed.chainId));

  if (fn.stateMutability === 'view' || fn.stateMutability === 'pure') {
    return client.readContract({
      abi,
      address: parsed.address,
      functionName,
      args,
    } as Parameters<typeof client.readContract>[0]);
  }

  if (!parsed.account) {
    throw new Error(`Write function ${functionName} requires an "account" field`);
  }

  const callData: Hex = encodeFunctionData({
    abi,
    functionName,
    args,
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
    account: parsed.account,
    to,
    data,
    value: parsed.value,
  });
}
