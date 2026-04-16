import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { hexSchema, parentChainPublicClientSchema } from './common';
import { getBridgeUiConfig } from '../../getBridgeUiConfig';

export const getBridgeUiConfigSchema = parentChainPublicClientSchema
  .extend({
    deploymentTxHash: hexSchema,
    chainName: z.string().optional(),
    rpcUrl: z.url().optional(),
    explorerUrl: z.url().optional(),
  })
  .strict()
  .transform((input): Parameters<typeof getBridgeUiConfig> => {
    const parentChain = findChain(input.parentChainId);

    return [
      {
        params: {
          parentChain,
          deploymentTxHash: input.deploymentTxHash,
          chainName: input.chainName,
          rpcUrl: input.rpcUrl,
          explorerUrl: input.explorerUrl,
        },
        parentChainPublicClient: toPublicClient(input.parentChainRpcUrl, parentChain),
      },
    ];
  });
