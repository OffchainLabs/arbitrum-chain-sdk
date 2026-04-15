import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, actionWriteBaseSchema } from '../common';
import { buildSetIsBatchPoster } from '../../../actions/buildSetIsBatchPoster';

export const buildSetIsBatchPosterSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    batchPoster: addressSchema,
    enable: z.boolean(),
  })
  .strict();

export const buildSetIsBatchPosterTransform = (
  input: z.output<typeof buildSetIsBatchPosterSchema>,
): Parameters<typeof buildSetIsBatchPoster> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: input.account,
    upgradeExecutor: input.upgradeExecutor ?? false,
    sequencerInbox: input.sequencerInbox,
    params: { batchPoster: input.batchPoster, enable: input.enable },
  },
];
