import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { isTokenBridgeDeployed } from '../../isTokenBridgeDeployed';

export const isTokenBridgeDeployedSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    parentChainId: z.number(),
    orbitChainRpcUrl: z.string().url(),
    rollup: addressSchema,
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const isTokenBridgeDeployedTransform = (
  input: z.output<typeof isTokenBridgeDeployedSchema>,
): Parameters<typeof isTokenBridgeDeployed> => [
  {
    parentChainPublicClient: toPublicClient(input.parentChainRpcUrl, findChain(input.parentChainId)),
    orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
    rollup: input.rollup,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
