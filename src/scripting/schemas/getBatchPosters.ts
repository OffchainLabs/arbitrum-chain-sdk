import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';
import { getBatchPosters } from '../../getBatchPosters';

export const getBatchPostersSchema = publicClientSchema
  .extend({
    rollup: addressSchema,
    sequencerInbox: addressSchema,
  })
  .strict();

export const getBatchPostersTransform = (
  input: z.output<typeof getBatchPostersSchema>,
): Parameters<typeof getBatchPosters> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { rollup: input.rollup, sequencerInbox: input.sequencerInbox },
];
