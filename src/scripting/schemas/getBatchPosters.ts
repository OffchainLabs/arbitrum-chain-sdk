import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { getBatchPosters } from '../../getBatchPosters';

export const getBatchPostersSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number().optional(),
    rollup: addressSchema,
    sequencerInbox: addressSchema,
  })
  .strict();

export const getBatchPostersTransform = (
  input: z.output<typeof getBatchPostersSchema>,
): Parameters<typeof getBatchPosters> => [
  toPublicClient(input.rpcUrl, input.chainId ? findChain(input.chainId) : undefined),
  { rollup: input.rollup, sequencerInbox: input.sequencerInbox },
];
