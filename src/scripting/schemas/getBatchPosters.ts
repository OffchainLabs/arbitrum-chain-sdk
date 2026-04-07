import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';
import { getBatchPosters } from '../../getBatchPosters';

export const getBatchPostersSchema = z
  .object({
    rpcUrl: z.string().url(),
    rollup: addressSchema,
    sequencerInbox: addressSchema,
  })
  .strict();

export const getBatchPostersTransform = (
  input: z.output<typeof getBatchPostersSchema>,
): Parameters<typeof getBatchPosters> => [
  toPublicClient(input.rpcUrl),
  { rollup: input.rollup, sequencerInbox: input.sequencerInbox },
];
