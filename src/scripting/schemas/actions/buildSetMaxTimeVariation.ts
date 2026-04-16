import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import {
  addressSchema,
  sequencerInboxMaxTimeVariationSchema,
  actionWriteBaseSchema,
} from '../common';

export const buildSetMaxTimeVariationSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    ...sequencerInboxMaxTimeVariationSchema.shape,
  })
  .strict();

export const buildSetMaxTimeVariationTransform = (
  input: z.output<typeof buildSetMaxTimeVariationSchema>,
) => {
  const { rpcUrl, chainId, delayBlocks, futureBlocks, delaySeconds, futureSeconds, ...rest } = input;
  return [
    toPublicClient(rpcUrl, findChain(chainId)),
    { ...rest, params: { delayBlocks, futureBlocks, delaySeconds, futureSeconds } },
  ] as const;
};
