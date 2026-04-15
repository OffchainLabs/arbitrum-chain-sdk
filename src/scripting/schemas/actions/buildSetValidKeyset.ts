import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema, actionWriteBaseSchema } from '../common';
import { buildSetValidKeyset } from '../../../actions/buildSetValidKeyset';

export const buildSetValidKeysetSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    keyset: hexSchema,
  })
  .strict();

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
