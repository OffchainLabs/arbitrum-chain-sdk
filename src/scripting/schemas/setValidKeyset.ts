import { toPublicClient, toWalletClient, findOrDefineChain } from '../viemTransforms';
import {
  hexSchema,
  coreContractsSchema,
  parentChainPublicClientSchema,
  privateKeySchema,
} from './common';

export const setValidKeysetSchema = parentChainPublicClientSchema
  .extend({
    privateKey: privateKeySchema,
    coreContracts: coreContractsSchema.pick({
      upgradeExecutor: true,
      sequencerInbox: true,
    }),
    keyset: hexSchema,
  })
  .strict()
  .transform((input) => {
    const { parentChainRpcUrl, parentChainId, privateKey, ...rest } = input;
    const chain = findOrDefineChain(parentChainId);
    return [
      {
        ...rest,
        publicClient: toPublicClient(parentChainRpcUrl, chain),
        walletClient: toWalletClient(parentChainRpcUrl, privateKey, chain),
      },
    ] as const;
  });
