import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, hexSchema, coreContractsSchema } from './common';

export const setValidKeysetPrepareTransactionRequestSchema = z
  .object({
    rpcUrl: z.string().url(),
    account: addressSchema,
    coreContracts: coreContractsSchema.pick({
      upgradeExecutor: true,
      sequencerInbox: true,
    }),
    keyset: hexSchema,
  })
  .strict();

export const setValidKeysetPrepareTransactionRequestTransform = (
  input: z.output<typeof setValidKeysetPrepareTransactionRequestSchema>,
) =>
  [
    {
      coreContracts: input.coreContracts,
      keyset: input.keyset,
      account: input.account,
      publicClient: toPublicClient(input.rpcUrl),
    },
  ] as const;
