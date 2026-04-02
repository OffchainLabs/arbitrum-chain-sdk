import { z } from 'zod';
import { toPublicClient, toAccount } from '../viemTransforms';
import { addressSchema } from './common';

export const setAnyTrustFastConfirmerSchema = z
  .object({
    rpcUrl: z.string().url(),
    privateKey: z.string().startsWith('0x'),
    rollup: addressSchema,
    upgradeExecutor: addressSchema,
    fastConfirmer: addressSchema,
  })
  .strict();

export const setAnyTrustFastConfirmerTransform = (
  input: z.output<typeof setAnyTrustFastConfirmerSchema>,
) =>
  [
    {
      publicClient: toPublicClient(input.rpcUrl),
      account: toAccount(input.privateKey),
      rollup: input.rollup,
      upgradeExecutor: input.upgradeExecutor,
      fastConfirmer: input.fastConfirmer,
    },
  ] as const;
