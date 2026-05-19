import { z, ZodType } from 'zod';
import type { Abi } from 'viem';
import { formatAbiItem } from 'viem/utils';
import type { AbiFunction } from 'abitype';

import { addressSchema, bigintSchema, publicClientSchema } from './schemas/common';

const baseReadFields = publicClientSchema.extend({ address: addressSchema });

const baseWriteFields = baseReadFields.extend({
  account: addressSchema,
  upgradeExecutor: addressSchema.optional(),
});

const baseWritePayableFields = baseWriteFields.extend({
  value: bigintSchema.optional(),
});

function isReadable(fn: AbiFunction): boolean {
  return fn.stateMutability === 'view' || fn.stateMutability === 'pure';
}

function isPayable(fn: AbiFunction): boolean {
  return fn.stateMutability === 'payable';
}

function pickBase(fn: AbiFunction) {
  if (isReadable(fn)) return baseReadFields;
  if (isPayable(fn)) return baseWritePayableFields;
  return baseWriteFields;
}

export function buildContractCommandSchema(
  abi: Abi,
  fnSchemas: Record<string, ZodType>,
): ZodType<readonly unknown[]> {
  const fns = abi.filter((e): e is AbiFunction => e.type === 'function');
  const variants = fns.map((fn) => {
    const sig = formatAbiItem(fn);
    return pickBase(fn).extend({ function: z.literal(sig), args: fnSchemas[sig] });
  });
  return z
    .discriminatedUnion(
      'function',
      variants as unknown as [(typeof variants)[number], (typeof variants)[number]],
    )
    .transform((i) => [i] as const);
}
