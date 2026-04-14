import { z } from 'zod';
import { toPublicClient, findChain } from '../../viemTransforms';
import { addressSchema } from '../common';
import { buildSetAllowListEnabled } from '../../../actions/buildSetAllowListEnabled';

export const buildSetAllowListEnabledSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  account: addressSchema,
  upgradeExecutor: addressSchema.optional(),
  inbox: addressSchema,
  enabled: z.boolean(),
});

export const buildSetAllowListEnabledTransform = (
  input: z.output<typeof buildSetAllowListEnabledSchema>,
): Parameters<typeof buildSetAllowListEnabled> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: input.account,
    upgradeExecutor: input.upgradeExecutor ?? false,
    inbox: input.inbox,
    params: { enabled: input.enabled },
  },
];
