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
): Parameters<typeof setValidKeysetPrepareTransactionRequest> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};
