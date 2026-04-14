import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema, hexSchema } from '../common';
import { isValidKeysetHash } from '../../../actions/isValidKeysetHash';

export const isValidKeysetHashSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  sequencerInbox: addressSchema,
  keysetHash: hexSchema,
});

export const isValidKeysetHashTransform = (
  input: z.output<typeof isValidKeysetHashSchema>,
): Parameters<typeof isValidKeysetHash> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    sequencerInbox: input.sequencerInbox,
    params: { keysetHash: input.keysetHash },
  },
];
