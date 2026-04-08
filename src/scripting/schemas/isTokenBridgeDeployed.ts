import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema } from './common';
import { isTokenBridgeDeployed } from '../../isTokenBridgeDeployed';

export const isTokenBridgeDeployedSchema = z.strictObject({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
  orbitChainRpcUrl: z.url(),
  rollup: addressSchema,
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export const isTokenBridgeDeployedTransform = (
  input: z.output<typeof isTokenBridgeDeployedSchema>,
): Parameters<typeof isTokenBridgeDeployed> => [
  {
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
    rollup: input.rollup,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
