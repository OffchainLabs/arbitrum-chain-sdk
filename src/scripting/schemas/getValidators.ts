import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';
import { getValidators } from '../../getValidators';

export const getValidatorsSchema = z
  .object({
    rpcUrl: z.string().url(),
    rollup: addressSchema,
  })
  .strict();

export const getValidatorsTransform = (
  input: z.output<typeof getValidatorsSchema>,
): Parameters<typeof getValidators> => [toPublicClient(input.rpcUrl), { rollup: input.rollup }];
