import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema } from '../common';
import { isBatchPoster } from '../../../actions/isBatchPoster';

export const isBatchPosterSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  sequencerInbox: addressSchema,
  batchPoster: addressSchema,
});

export const isBatchPosterTransform = (
  input: z.output<typeof isBatchPosterSchema>,
): Parameters<typeof isBatchPoster> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    sequencerInbox: input.sequencerInbox,
    params: { batchPoster: input.batchPoster },
  },
];
