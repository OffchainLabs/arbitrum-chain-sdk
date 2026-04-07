import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { getValidators } from '../../getValidators';

export const getValidatorsSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number().optional(),
    rollup: addressSchema,
  })
  .strict();

export const getValidatorsTransform = (
  input: z.output<typeof getValidatorsSchema>,
): Parameters<typeof getValidators> => [
  toPublicClient(input.rpcUrl, input.chainId ? findChain(input.chainId) : undefined),
  { rollup: input.rollup },
];
