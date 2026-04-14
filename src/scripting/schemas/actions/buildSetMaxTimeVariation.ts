import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../../viemTransforms';
import {
  addressSchema,
  privateKeySchema,
  sequencerInboxMaxTimeVariationSchema,
} from '../common';
import { buildSetMaxTimeVariation } from '../../../actions/buildSetMaxTimeVariation';

export const buildSetMaxTimeVariationSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  privateKey: privateKeySchema,
  upgradeExecutor: addressSchema.optional(),
  sequencerInbox: addressSchema,
  ...sequencerInboxMaxTimeVariationSchema.shape,
});

export const buildSetMaxTimeVariationTransform = (
  input: z.output<typeof buildSetMaxTimeVariationSchema>,
): Parameters<typeof buildSetMaxTimeVariation> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: toAccount(input.privateKey).address,
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
