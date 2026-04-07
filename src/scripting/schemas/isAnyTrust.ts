import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';
import { isAnyTrust } from '../../isAnyTrust';

export const isAnyTrustSchema = z
  .object({
    rpcUrl: z.string().url(),
    rollup: addressSchema,
  })
  .strict();

export const isAnyTrustTransform = (
  input: z.output<typeof isAnyTrustSchema>,
): Parameters<typeof isAnyTrust> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl),
  },
];
