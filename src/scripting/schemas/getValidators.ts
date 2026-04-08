import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { getValidators } from '../../getValidators';

export const getValidatorsSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  rollup: addressSchema,
});

export const getValidatorsTransform = (
  input: z.output<typeof getValidatorsSchema>,
): Parameters<typeof getValidators> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { rollup: input.rollup },
];
