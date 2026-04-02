import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const fetchAllowanceSchema = z
  .object({
    rpcUrl: z.string().url(),
    address: addressSchema,
    owner: addressSchema,
    spender: addressSchema,
  })
  .strict();

export const fetchAllowanceTransform = (input: z.output<typeof fetchAllowanceSchema>) =>
  [
    {
      address: input.address,
      owner: input.owner,
      spender: input.spender,
      publicClient: toPublicClient(input.rpcUrl),
    },
  ] as const;

export const fetchDecimalsSchema = z
  .object({
    rpcUrl: z.string().url(),
    address: addressSchema,
  })
  .strict();

export const fetchDecimalsTransform = (input: z.output<typeof fetchDecimalsSchema>) =>
  [
    {
      address: input.address,
      publicClient: toPublicClient(input.rpcUrl),
    },
  ] as const;
