import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema, actionWriteBaseSchema } from '../common';
import { buildInvalidateKeysetHash } from '../../../actions/buildInvalidateKeysetHash';

export const buildInvalidateKeysetHashSchema = actionWriteBaseSchema
  .extend({
    sequencerInbox: addressSchema,
    keysetHash: hexSchema,
  })
  .strict();

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
