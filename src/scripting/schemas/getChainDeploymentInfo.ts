import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema } from './common';
import { getChainDeploymentInfo } from '../../getChainDeploymentInfo';

export const getChainDeploymentInfoSchema = z.strictObject({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
  rollup: addressSchema,
  chainName: z.string(),
  rollupDeploymentBlockNumber: bigintSchema.optional(),
});

export const getChainDeploymentInfoTransform = (
  input: z.output<typeof getChainDeploymentInfoSchema>,
): Parameters<typeof getChainDeploymentInfo> => [
  {
    rollup: input.rollup,
    chainName: input.chainName,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    rollupDeploymentBlockNumber: input.rollupDeploymentBlockNumber,
  },
];
