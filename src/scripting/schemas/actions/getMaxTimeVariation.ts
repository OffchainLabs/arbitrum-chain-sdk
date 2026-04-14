import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema } from '../common';
import { getMaxTimeVariation } from '../../../actions/getMaxTimeVariation';

export const getMaxTimeVariationSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  sequencerInbox: addressSchema,
});

export const getMaxTimeVariationTransform = (
  input: z.output<typeof getMaxTimeVariationSchema>,
): Parameters<typeof getMaxTimeVariation> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    sequencerInbox: input.sequencerInbox,
  },
];
