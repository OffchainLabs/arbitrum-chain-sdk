import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema } from '../common';
import { buildInvalidateKeysetHash } from '../../../actions/buildInvalidateKeysetHash';

export const buildInvalidateKeysetHashSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  account: addressSchema,
  upgradeExecutor: addressSchema.optional(),
  sequencerInbox: addressSchema,
  keysetHash: hexSchema,
});

export const buildInvalidateKeysetHashTransform = (
  input: z.output<typeof buildInvalidateKeysetHashSchema>,
): Parameters<typeof buildInvalidateKeysetHash> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: input.account,
    upgradeExecutor: input.upgradeExecutor ?? false,
    sequencerInbox: input.sequencerInbox,
    params: { keysetHash: input.keysetHash },
  },
];
