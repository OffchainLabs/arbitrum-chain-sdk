import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema } from '../common';
import { isAllowed } from '../../../actions/isAllowed';

export const isAllowedSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  inbox: addressSchema,
  address: addressSchema,
});

export const isAllowedTransform = (
  input: z.output<typeof isAllowedSchema>,
): Parameters<typeof isAllowed> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    inbox: input.inbox,
    params: { address: input.address },
  },
];
