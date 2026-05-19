import { z, ZodType } from 'zod';
import type { Abi } from 'viem';
import type { AbiFunction, AbiParameter } from 'abitype';

import { addressSchema, bigintSchema, publicClientSchema } from './schemas/common';

// Inlined from abi-to-zod (which is ESM-only) so this module stays
// require()-able from the CJS scripting workspace. Must match abi-to-zod's
// keying exactly, since we look up function schemas by these strings.
function canonicalType(param: AbiParameter): string {
  const { base, suffixes } = splitArraySuffix(param.type);
  const components = (param as { components?: readonly AbiParameter[] }).components;
  const normalized =
    base === 'tuple'
      ? `(${(components ?? []).map(canonicalType).join(',')})`
      : base === 'uint'
      ? 'uint256'
      : base === 'int'
      ? 'int256'
      : base;
  return normalized + suffixes.join('');
}

function splitArraySuffix(type: string): { base: string; suffixes: string[] } {
  const suffixes: string[] = [];
  let base = type;
  while (true) {
    const m = /^(.*)(\[\d*\])$/.exec(base);
    if (!m) break;
    base = m[1];
    suffixes.unshift(m[2]);
  }
  return { base, suffixes };
}

function canonicalSignature(fn: AbiFunction): string {
  return `${fn.name}(${fn.inputs.map(canonicalType).join(',')})`;
}

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

// One variant per ABI function entry, keyed by canonical signature. Callers
// always specify the full signature (e.g. `getBatchPosters()`) so the
// discriminator is unambiguous regardless of overloads.
export function buildContractCommandSchema(
  abi: Abi,
  fnSchemas: Record<string, ZodType>,
): ZodType<readonly unknown[]> {
  const fns = abi.filter((e): e is AbiFunction => e.type === 'function');
  const variants = fns.map((fn) => {
    const sig = canonicalSignature(fn);
    return pickBase(fn).extend({ function: z.literal(sig), args: fnSchemas[sig] });
  });
  return z
    .discriminatedUnion(
      'function',
      variants as unknown as [(typeof variants)[number], (typeof variants)[number]],
    )
    .transform((i) => [i] as const);
}
