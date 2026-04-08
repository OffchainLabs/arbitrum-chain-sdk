import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { getBatchPosters } from '../../getBatchPosters';

export const getBatchPostersSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  rollup: addressSchema,
  sequencerInbox: addressSchema,
});

export const getBatchPostersTransform = (
  input: z.output<typeof getBatchPostersSchema>,
): Parameters<typeof getBatchPosters> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { rollup: input.rollup, sequencerInbox: input.sequencerInbox },
];
