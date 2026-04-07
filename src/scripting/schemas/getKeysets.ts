import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { getKeysets } from '../../getKeysets';

export const getKeysetsSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number(),
    sequencerInbox: addressSchema,
  })
  .strict();

export const getKeysetsTransform = (
  input: z.output<typeof getKeysetsSchema>,
): Parameters<typeof getKeysets> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { sequencerInbox: input.sequencerInbox },
];
