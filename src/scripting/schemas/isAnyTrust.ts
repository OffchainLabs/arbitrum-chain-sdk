import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';
import { isAnyTrust } from '../../isAnyTrust';

export const isAnyTrustSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
  })
  .strict();

export const isAnyTrustTransform = (
  input: z.output<typeof isAnyTrustSchema>,
): Parameters<typeof isAnyTrust> => [
  {
    rollup: input.rollup,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
  },
];
