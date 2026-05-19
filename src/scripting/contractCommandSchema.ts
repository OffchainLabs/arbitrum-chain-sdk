import { z, ZodType } from 'zod';
import type { Abi } from 'viem';
import type { AbiFunction } from 'abitype';
import { canonicalSignature } from 'abi-to-zod';

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

// A discriminated union whose discriminant is the function name (or canonical
// signature for overloaded names). Each variant pairs the literal discriminant
// with that function's args tuple and the read/write fields appropriate to its
// mutability. The full canonical signature is used for both overloads of any
// name so zod's unique-discriminant requirement holds.
export function buildContractCommandSchema(
  abi: Abi,
  fnSchemas: Record<string, ZodType>,
): ZodType<readonly unknown[]> {
  const fns = abi.filter((e): e is AbiFunction => e.type === 'function');

  const overloadedNames = new Set<string>();
  const seen = new Set<string>();
  for (const fn of fns) {
    if (seen.has(fn.name)) overloadedNames.add(fn.name);
    seen.add(fn.name);
  }

  const variants = fns
    .map((fn) => {
      const key = overloadedNames.has(fn.name) ? canonicalSignature(fn) : fn.name;
      const args = fnSchemas[key];
      if (!args) return null;
      return pickBase(fn).extend({
        function: z.literal(key),
        args,
      });
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  if (variants.length === 0) {
    return z
      .never()
      .transform(() => [] as const)
      .describe('This contract exposes no callable functions.');
  }

  // discriminatedUnion requires at least two variants; for single-function
  // contracts wrap in a one-element union via z.union, which behaves the same
  // for the single-element case.
  const union =
    variants.length === 1
      ? variants[0]
      : z.discriminatedUnion(
          'function',
          variants as unknown as [(typeof variants)[number], (typeof variants)[number]],
        );

  return union.transform((i) => [i] as const);
}
