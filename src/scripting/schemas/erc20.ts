import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { fetchAllowance, fetchDecimals } from '../../utils/erc20';

export const fetchAllowanceSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number().optional(),
    address: addressSchema,
    owner: addressSchema,
    spender: addressSchema,
  })
  .strict();

export const fetchAllowanceTransform = (
  input: z.output<typeof fetchAllowanceSchema>,
): Parameters<typeof fetchAllowance> => [
  {
    address: input.address,
    owner: input.owner,
    spender: input.spender,
    publicClient: toPublicClient(input.rpcUrl, input.chainId ? findChain(input.chainId) : undefined),
  },
];

export const fetchDecimalsSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number().optional(),
    address: addressSchema,
  })
  .strict();

export const fetchDecimalsTransform = (
  input: z.output<typeof fetchDecimalsSchema>,
): Parameters<typeof fetchDecimals> => [
  {
    address: input.address,
    publicClient: toPublicClient(input.rpcUrl, input.chainId ? findChain(input.chainId) : undefined),
  },
];
