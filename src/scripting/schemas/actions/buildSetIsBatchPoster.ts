import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../../viemTransforms';
import { addressSchema, privateKeySchema } from '../common';
import { buildSetIsBatchPoster } from '../../../actions/buildSetIsBatchPoster';

export const buildSetIsBatchPosterSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  privateKey: privateKeySchema,
  upgradeExecutor: addressSchema.optional(),
  sequencerInbox: addressSchema,
  batchPoster: addressSchema,
  enable: z.boolean(),
});

export const buildSetIsBatchPosterTransform = (
  input: z.output<typeof buildSetIsBatchPosterSchema>,
): Parameters<typeof buildSetIsBatchPoster> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: toAccount(input.privateKey).address,
    upgradeExecutor: input.upgradeExecutor ?? false,
    sequencerInbox: input.sequencerInbox,
    params: { batchPoster: input.batchPoster, enable: input.enable },
  },
];
