import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, rollupCreatorVersionSchema } from './common';
import { createRollupGetRetryablesFees } from '../../createRollupGetRetryablesFees';

export const createRollupGetRetryablesFeesSchema = z
  .object({
    rpcUrl: z.string().url(),
    account: addressSchema,
    nativeToken: addressSchema.optional(),
    maxFeePerGasForRetryables: bigintSchema.optional(),
    rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
  })
  .strict();

export const createRollupGetRetryablesFeesTransform = (
  input: z.output<typeof createRollupGetRetryablesFeesSchema>,
): Parameters<typeof createRollupGetRetryablesFees> => [
  toPublicClient(input.rpcUrl),
  {
    account: input.account,
    nativeToken: input.nativeToken,
    maxFeePerGasForRetryables: input.maxFeePerGasForRetryables,
  },
  input.rollupCreatorVersion,
];
