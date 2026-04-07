import { z } from 'zod';
import { toPublicClient, toAccount, findChain } from '../viemTransforms';
import { addressSchema, privateKeySchema } from './common';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

export const setAnyTrustFastConfirmerSchema = z
  .object({
    rpcUrl: z.string().url(),
    chainId: z.number(),
    privateKey: privateKeySchema,
    rollup: addressSchema,
    upgradeExecutor: addressSchema,
    fastConfirmer: addressSchema,
  })
  .strict();

export const setAnyTrustFastConfirmerTransform = (
  input: z.output<typeof setAnyTrustFastConfirmerSchema>,
): Parameters<typeof setAnyTrustFastConfirmerPrepareTransactionRequest> => [
  {
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    account: toAccount(input.privateKey),
    rollup: input.rollup,
    upgradeExecutor: input.upgradeExecutor,
    fastConfirmer: input.fastConfirmer,
  },
];
