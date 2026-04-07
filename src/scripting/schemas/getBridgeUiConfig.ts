import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { hexSchema } from './common';
import { getBridgeUiConfig } from '../../getBridgeUiConfig';

export const getBridgeUiConfigSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    parentChainId: z.number(),
    deploymentTxHash: hexSchema,
    chainName: z.string().optional(),
    rpcUrl: z.string().url().optional(),
    explorerUrl: z.string().url().optional(),
  })
  .strict();

export const getBridgeUiConfigTransform = (
  input: z.output<typeof getBridgeUiConfigSchema>,
): Parameters<typeof getBridgeUiConfig> => {
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
};
