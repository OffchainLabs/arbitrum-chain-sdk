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

// Transaction value is wei (a uint256). bigintSchema accepts a leading minus,
// so guard non-negativity here rather than letting a negative value reach viem.
const valueSchema = bigintSchema.refine((v) => v >= 0n, 'Expected a non-negative value');

export function buildContractCommandSchema(
  abi: Abi,
  fnSchemas: Record<string, ZodType>,
  hasFixedAddress = false,
): ZodType<readonly unknown[]> {
  const read = hasFixedAddress
    ? publicClientSchema
    : publicClientSchema.extend({ address: addressSchema });
  const write = read.extend({ account: addressSchema, upgradeExecutor: addressSchema.optional() });
  const writePayable = write.extend({ value: valueSchema.optional() });

  const fns = abi.filter((e): e is AbiFunction => e.type === 'function');
  const variants = fns.map((fn) => {
    const sig = formatAbiItem(fn);
    const argSchema = fnSchemas[sig];
    if (!argSchema) throw new Error(`buildContractCommandSchema: no arg schema for ${sig}`);
    const base = isReadable(fn) ? read : isPayable(fn) ? writePayable : write;
    const args = fn.inputs.length === 0 ? argSchema.optional().default([]) : argSchema;
    return base.extend({ function: z.literal(sig), args });
  });
  // discriminatedUnion throws an opaque error on an empty members array; fail
  // with a clear message if a registry ABI exposes no callable functions.
  if (variants.length === 0) throw new Error('buildContractCommandSchema: ABI has no functions');
  return z
    .discriminatedUnion(
      'function',
      variants as unknown as [(typeof variants)[number], (typeof variants)[number]],
    )
    .transform((i) => [i] as const);
}
