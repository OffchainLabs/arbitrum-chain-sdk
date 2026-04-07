import { z } from 'zod';
import { toPublicClient, toAccount } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';
import { createSafePrepareTransactionRequest } from '../../createSafePrepareTransactionRequest';

export const createSafePrepareTransactionRequestSchema = z
  .object({
    rpcUrl: z.string().url(),
    privateKey: z.string().startsWith('0x'),
    owners: z.array(addressSchema),
    threshold: z.number(),
    saltNonce: bigintSchema.optional(),
  })
  .strict();

export const createSafePrepareTransactionRequestTransform = (
  input: z.output<typeof createSafePrepareTransactionRequestSchema>,
): Parameters<typeof createSafePrepareTransactionRequest> => [
  {
    publicClient: toPublicClient(input.rpcUrl),
    account: toAccount(input.privateKey),
    owners: input.owners,
    threshold: input.threshold,
    saltNonce: input.saltNonce,
  },
];
