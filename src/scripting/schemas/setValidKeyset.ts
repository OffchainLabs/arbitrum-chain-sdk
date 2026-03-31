import { z } from 'zod';
import { toPublicClient, toWalletClient } from '../viemTransforms';
import { hexSchema, coreContractsSchema } from './common';

export const setValidKeysetSchema = z.object({
  parentChainRpcUrl: z.string().url(),
  privateKey: z.string().startsWith('0x'),
  coreContracts: coreContractsSchema.pick({
    upgradeExecutor: true,
    sequencerInbox: true,
  }),
  keyset: hexSchema,
});

export const setValidKeysetTransform = (input: z.output<typeof setValidKeysetSchema>) => [{
  coreContracts: input.coreContracts,
  keyset: input.keyset,
  publicClient: toPublicClient(input.parentChainRpcUrl),
  walletClient: toWalletClient(input.parentChainRpcUrl, input.privateKey),
}] as const;
