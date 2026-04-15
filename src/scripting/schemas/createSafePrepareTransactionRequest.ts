import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema, privateKeySchema, publicClientSchema } from './common';
import { createSafePrepareTransactionRequest } from '../../createSafePrepareTransactionRequest';

export const createSafePrepareTransactionRequestSchema = publicClientSchema
  .extend({
    privateKey: privateKeySchema,
    owners: z.array(addressSchema),
    threshold: z.number(),
    saltNonce: bigintSchema.optional(),
  })
  .strict();

export const createSafePrepareTransactionRequestTransform = (
  input: z.output<typeof createSafePrepareTransactionRequestSchema>,
): Parameters<typeof createSafePrepareTransactionRequest> => [
  {
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    account: toAccount(input.privateKey),
    owners: input.owners,
    threshold: input.threshold,
    saltNonce: input.saltNonce,
  },
];
