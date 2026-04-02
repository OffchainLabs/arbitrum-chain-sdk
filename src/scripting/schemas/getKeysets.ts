import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';

export const getKeysetsSchema = z
  .object({
    rpcUrl: z.string().url(),
    sequencerInbox: addressSchema,
  })
  .strict();

export const getKeysetsTransform = (input: z.output<typeof getKeysetsSchema>) =>
  [toPublicClient(input.rpcUrl), { sequencerInbox: input.sequencerInbox }] as const;
