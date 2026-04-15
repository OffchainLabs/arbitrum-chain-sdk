import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, publicClientSchema } from './common';
import { getKeysets } from '../../getKeysets';

export const getKeysetsSchema = publicClientSchema
  .extend({
    sequencerInbox: addressSchema,
  })
  .strict();

export const getKeysetsTransform = (
  input: z.output<typeof getKeysetsSchema>,
): Parameters<typeof getKeysets> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { sequencerInbox: input.sequencerInbox },
];
