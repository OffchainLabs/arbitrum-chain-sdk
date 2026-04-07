import { z } from 'zod';
import { toPublicClient, toWalletClient, findChain } from '../viemTransforms';
import { hexSchema, coreContractsSchema, privateKeySchema } from './common';
import { setValidKeyset } from '../../setValidKeyset';

export const setValidKeysetSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    parentChainId: z.number(),
    privateKey: privateKeySchema,
    coreContracts: coreContractsSchema.pick({
      upgradeExecutor: true,
      sequencerInbox: true,
    }),
    keyset: hexSchema,
  })
  .strict();

export const setValidKeysetTransform = (
  input: z.output<typeof setValidKeysetSchema>,
): Parameters<typeof setValidKeyset> => [
  {
    coreContracts: input.coreContracts,
    keyset: input.keyset,
    publicClient: toPublicClient(input.parentChainRpcUrl, findChain(input.parentChainId)),
    walletClient: toWalletClient(
      input.parentChainRpcUrl,
      input.privateKey,
      findChain(input.parentChainId),
    ),
  },
];
