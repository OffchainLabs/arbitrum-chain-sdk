import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import {
  addressSchema,
  sequencerInboxMaxTimeVariationSchema,
  actionWriteBaseSchema,
} from '../common';
import { buildSetMaxTimeVariation } from '../../../actions/buildSetMaxTimeVariation';

export const buildSetMaxTimeVariationSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    ...sequencerInboxMaxTimeVariationSchema.shape,
  })
  .strict();

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
