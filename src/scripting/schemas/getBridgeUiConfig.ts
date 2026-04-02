import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { hexSchema } from './common';

export const getBridgeUiConfigSchema = z.object({
  parentChainRpcUrl: z.string().url(),
  parentChainId: z.number(),
  deploymentTxHash: hexSchema,
  chainName: z.string().optional(),
  rpcUrl: z.string().optional(),
  explorerUrl: z.string().optional(),
}).strict();

export const getBridgeUiConfigTransform = (
  input: z.output<typeof getBridgeUiConfigSchema>,
) => [{
  params: {
    parentChain: {
      id: input.parentChainId,
      name: 'Parent Chain',
      network: 'parent-chain',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [input.parentChainRpcUrl] },
        public: { http: [input.parentChainRpcUrl] },
      },
    } as Chain,
    deploymentTxHash: input.deploymentTxHash,
    chainName: input.chainName,
    rpcUrl: input.rpcUrl,
    explorerUrl: input.explorerUrl,
  },
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
}] as const;
