import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';
import { getKeysets } from '../../getKeysets';

export const getKeysetsSchema = z
  .object({
    rpcUrl: z.string().url(),
    sequencerInbox: addressSchema,
  })
  .strict();

export const getKeysetsTransform = (
  input: z.output<typeof getKeysetsSchema>,
): Parameters<typeof getKeysets> => [
  toPublicClient(input.rpcUrl),
  { sequencerInbox: input.sequencerInbox },
];
