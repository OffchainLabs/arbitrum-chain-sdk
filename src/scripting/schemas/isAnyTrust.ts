import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { isAnyTrust } from '../../isAnyTrust';

export const isAnyTrustSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  rollup: addressSchema,
});

export const isAnyTrustTransform = (
  input: z.output<typeof isAnyTrustSchema>,
): Parameters<typeof isAnyTrust> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
  },
];
