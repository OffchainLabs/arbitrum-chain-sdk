import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient } from '../viemTransforms';
import { hexSchema } from './common';
import { chains, getCustomParentChains } from '../../chains';

function findChain(chainId: number): Chain {
  const chain = [...chains, ...getCustomParentChains()].find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }
  return chain;
}

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
) => {
  const parentChain = findChain(input.parentChainId);

  return [{
    params: {
      parentChain,
      deploymentTxHash: input.deploymentTxHash,
      chainName: input.chainName,
      rpcUrl: input.rpcUrl,
      explorerUrl: input.explorerUrl,
    },
    parentChainPublicClient: toPublicClient(input.parentChainRpcUrl, parentChain),
  }] as const;
};
