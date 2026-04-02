import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const getValidatorsSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
}).strict();

export const getValidatorsTransform = (
  input: z.output<typeof getValidatorsSchema>,
) => [
  toPublicClient(input.rpcUrl),
  { rollup: input.rollup },
] as const;
