import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const isAnyTrustSchema = z.object({
  rpcUrl: z.string().url(),
  rollup: addressSchema,
}).strict();

export const isAnyTrustTransform = (
  input: z.output<typeof isAnyTrustSchema>,
) => [{
  rollup: input.rollup,
  publicClient: toPublicClient(input.rpcUrl),
}] as const;
