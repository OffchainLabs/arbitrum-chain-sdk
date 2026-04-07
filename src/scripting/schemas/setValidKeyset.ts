import { z } from 'zod';
import { toPublicClient, toWalletClient } from '../viemTransforms';
import { hexSchema, coreContractsSchema } from './common';
import { setValidKeyset } from '../../setValidKeyset';

export const setValidKeysetSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    privateKey: z.string().startsWith('0x'),
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
    publicClient: toPublicClient(input.parentChainRpcUrl),
    walletClient: toWalletClient(input.parentChainRpcUrl, input.privateKey),
  },
];
