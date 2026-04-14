import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../../viemTransforms';
import { addressSchema, privateKeySchema } from '../common';
import { buildSetAllowList } from '../../../actions/buildSetAllowList';

export const buildSetAllowListSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  privateKey: privateKeySchema,
  upgradeExecutor: addressSchema.optional(),
  inbox: addressSchema,
  addresses: z.array(addressSchema),
  allowed: z.array(z.boolean()),
});

export const buildSetAllowListTransform = (
  input: z.output<typeof buildSetAllowListSchema>,
): Parameters<typeof buildSetAllowList> => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  {
    account: toAccount(input.privateKey).address,
    upgradeExecutor: input.upgradeExecutor ?? false,
    inbox: input.inbox,
    params: { addresses: input.addresses, allowed: input.allowed },
  },
];
