import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema } from './common';
import { isTokenBridgeDeployed } from '../../isTokenBridgeDeployed';

export const isTokenBridgeDeployedSchema = z
  .object({
    parentChainRpcUrl: z.string().url(),
    orbitChainRpcUrl: z.string().url(),
    rollup: addressSchema,
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const isTokenBridgeDeployedTransform = (
  input: z.output<typeof isTokenBridgeDeployedSchema>,
): Parameters<typeof isTokenBridgeDeployed> => [
  {
    parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
    orbitChainPublicClient: toPublicClient(input.orbitChainRpcUrl),
    rollup: input.rollup,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
