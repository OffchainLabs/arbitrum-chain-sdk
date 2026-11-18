import { toPublicClient, findOrDefineChain } from '../../viemTransforms';
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
  .strict()
  .transform((input) => {
    const { rpcUrl, chainId, delayBlocks, futureBlocks, delaySeconds, futureSeconds, ...rest } =
      input;
    return [
      toPublicClient(rpcUrl, findOrDefineChain(chainId)),
      { ...rest, params: { delayBlocks, futureBlocks, delaySeconds, futureSeconds } },
    ] as const;
  });
