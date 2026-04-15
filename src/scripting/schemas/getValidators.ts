import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';
import { getValidators } from '../../getValidators';

export const getValidatorsSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
  })
  .strict();

export const getValidatorsTransform = (
  input: z.output<typeof getValidatorsSchema>,
): Parameters<typeof getValidators> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { rollup: input.rollup },
];
