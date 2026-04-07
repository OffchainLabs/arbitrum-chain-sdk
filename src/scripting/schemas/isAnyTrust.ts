import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { isAnyTrust } from '../../isAnyTrust';

export const isAnyTrustSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number().optional(),
    rollup: addressSchema,
  })
  .strict();

export const isAnyTrustTransform = (
  input: z.output<typeof isAnyTrustSchema>,
): Parameters<typeof isAnyTrust> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, input.chainId ? findChain(input.chainId) : undefined),
  },
];
