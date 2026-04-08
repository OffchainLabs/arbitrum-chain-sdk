import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, hexSchema, coreContractsSchema } from './common';
import { setValidKeysetPrepareTransactionRequest } from '../../setValidKeysetPrepareTransactionRequest';

export const setValidKeysetPrepareTransactionRequestSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  account: addressSchema,
  coreContracts: coreContractsSchema.pick({
    upgradeExecutor: true,
    sequencerInbox: true,
  }),
  keyset: hexSchema,
});

export const setValidKeysetPrepareTransactionRequestTransform = (
  input: z.output<typeof setValidKeysetPrepareTransactionRequestSchema>,
): Parameters<typeof setValidKeysetPrepareTransactionRequest> => [
  {
    coreContracts: input.coreContracts,
    keyset: input.keyset,
    account: input.account,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
  },
];
