import { z } from 'zod';
import { findChain, toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, gasOverridesSchema } from './common';
import { enqueueTokenBridgePrepareTransactionRequest } from '../../enqueueTokenBridgePrepareTransactionRequest';

export const enqueueTokenBridgePrepareTransactionRequestSchema = z
  .object({
    parentChainId: z.number(),
    parentChainRpcUrl: z.string().url(),
    account: addressSchema,
    params: z.object({
      rollup: addressSchema,
      rollupOwner: addressSchema,
    }),
    maxGasForContracts: bigintSchema.optional(),
    maxGasForFactory: bigintSchema.optional(),
    maxGasPrice: bigintSchema.optional(),
    gasOverrides: gasOverridesSchema.optional(),
    tokenBridgeCreatorAddressOverride: addressSchema.optional(),
  })
  .strict();

export const enqueueTokenBridgePrepareTransactionRequestTransform = (
  input: z.output<typeof enqueueTokenBridgePrepareTransactionRequestSchema>,
): Parameters<typeof enqueueTokenBridgePrepareTransactionRequest> => [
  {
    params: input.params,
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    account: input.account,
    gasOverrides: input.gasOverrides,
    maxGasForContracts: input.maxGasForContracts,
    maxGasForFactory: input.maxGasForFactory,
    maxGasPrice: input.maxGasPrice,
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
