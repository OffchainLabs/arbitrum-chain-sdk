import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../../viemTransforms';
import { addressSchema, privateKeySchema } from '../common';
import { buildSetAllowListEnabled } from '../../../actions/buildSetAllowListEnabled';

export const buildSetAllowListEnabledSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  privateKey: privateKeySchema,
  upgradeExecutor: addressSchema.optional(),
  inbox: addressSchema,
  enabled: z.boolean(),
});

export const buildSetAllowListEnabledTransform = (
  input: z.output<typeof buildSetAllowListEnabledSchema>,
): Parameters<typeof buildSetAllowListEnabled> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: toAccount(input.privateKey).address,
    upgradeExecutor: input.upgradeExecutor ?? false,
    inbox: input.inbox,
    params: { enabled: input.enabled },
  },
];
