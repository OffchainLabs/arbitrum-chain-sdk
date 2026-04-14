import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema } from '../common';
import { isAllowListEnabled } from '../../../actions/isAllowListEnabled';

export const isAllowListEnabledSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  inbox: addressSchema,
});

export const isAllowListEnabledTransform = (
  input: z.output<typeof isAllowListEnabledSchema>,
): Parameters<typeof isAllowListEnabled> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    inbox: input.inbox,
  },
];
