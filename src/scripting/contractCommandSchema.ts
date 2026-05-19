import { z, ZodType } from 'zod';
import type { Abi } from 'viem';
import { formatAbiItem } from 'viem/utils';
import type { AbiFunction } from 'abitype';

import { addressSchema, bigintSchema, publicClientSchema } from './schemas/common';

function isReadable(fn: AbiFunction): boolean {
  return fn.stateMutability === 'view' || fn.stateMutability === 'pure';
}

function isPayable(fn: AbiFunction): boolean {
  return fn.stateMutability === 'payable';
}

export function buildContractCommandSchema(
  abi: Abi,
  fnSchemas: Record<string, ZodType>,
  hasFixedAddress = false,
): ZodType<readonly unknown[]> {
  const read = hasFixedAddress
    ? publicClientSchema
    : publicClientSchema.extend({ address: addressSchema });
  const write = read.extend({ account: addressSchema, upgradeExecutor: addressSchema.optional() });
  const writePayable = write.extend({ value: bigintSchema.optional() });

  const fns = abi.filter((e): e is AbiFunction => e.type === 'function');
  const variants = fns.map((fn) => {
    const sig = formatAbiItem(fn);
    const base = isReadable(fn) ? read : isPayable(fn) ? writePayable : write;
    const args = fn.inputs.length === 0 ? fnSchemas[sig].optional().default([]) : fnSchemas[sig];
    return base.extend({ function: z.literal(sig), args });
  });
  return z
    .discriminatedUnion(
      'function',
      variants as unknown as [(typeof variants)[number], (typeof variants)[number]],
    )
    .transform((i) => [i] as const);
}
