import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema } from '../common';
import { buildSetValidKeyset } from '../../../actions/buildSetValidKeyset';

export const buildSetValidKeysetSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  account: addressSchema,
  upgradeExecutor: addressSchema.optional(),
  sequencerInbox: addressSchema,
  keyset: hexSchema,
});

export const buildSetValidKeysetTransform = (
  input: z.output<typeof buildSetValidKeysetSchema>,
): Parameters<typeof buildSetValidKeyset> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: input.account,
    upgradeExecutor: input.upgradeExecutor ?? false,
    sequencerInbox: input.sequencerInbox,
    params: { keyset: input.keyset },
  },
];
