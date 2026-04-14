import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, sequencerInboxMaxTimeVariationSchema } from '../common';
import { buildSetMaxTimeVariation } from '../../../actions/buildSetMaxTimeVariation';

export const buildSetMaxTimeVariationSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  account: addressSchema,
  upgradeExecutor: addressSchema.optional(),
  sequencerInbox: addressSchema,
  ...sequencerInboxMaxTimeVariationSchema.shape,
});

export const buildSetMaxTimeVariationTransform = (
  input: z.output<typeof buildSetMaxTimeVariationSchema>,
): Parameters<typeof buildSetMaxTimeVariation> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: input.account,
    upgradeExecutor: input.upgradeExecutor ?? false,
    sequencerInbox: input.sequencerInbox,
    params: {
      delayBlocks: input.delayBlocks,
      futureBlocks: input.futureBlocks,
      delaySeconds: input.delaySeconds,
      futureSeconds: input.futureSeconds,
    },
  },
];
