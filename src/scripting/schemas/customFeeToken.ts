import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, rollupCreatorVersionSchema } from './common';

const createRollupCustomFeeTokenBaseSchema = z.object({
  rpcUrl: z.string().url(),
  nativeToken: addressSchema,
  account: addressSchema,
  maxFeePerGasForRetryables: bigintSchema.optional(),
  rollupCreatorAddressOverride: addressSchema.optional(),
  rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
});

export const createRollupEnoughCustomFeeTokenAllowanceSchema =
  createRollupCustomFeeTokenBaseSchema.strict();

export const createRollupEnoughCustomFeeTokenAllowanceTransform = (
  input: z.output<typeof createRollupEnoughCustomFeeTokenAllowanceSchema>,
) =>
  [
    {
      nativeToken: input.nativeToken,
      maxFeePerGasForRetryables: input.maxFeePerGasForRetryables,
      account: input.account,
      publicClient: toPublicClient(input.rpcUrl),
      rollupCreatorAddressOverride: input.rollupCreatorAddressOverride,
      rollupCreatorVersion: input.rollupCreatorVersion,
    },
  ] as const;

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema =
  createRollupCustomFeeTokenBaseSchema
    .extend({
      amount: bigintSchema.optional(),
    })
    .strict();

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema>,
) =>
  [
    {
      amount: input.amount,
      nativeToken: input.nativeToken,
      maxFeePerGasForRetryables: input.maxFeePerGasForRetryables,
      account: input.account,
      publicClient: toPublicClient(input.rpcUrl),
      rollupCreatorAddressOverride: input.rollupCreatorAddressOverride,
      rollupCreatorVersion: input.rollupCreatorVersion,
    },
  ] as const;

const createTokenBridgeCustomFeeTokenBaseSchema = z.object({
  rpcUrl: z.string().url(),
  nativeToken: addressSchema,
  owner: addressSchema,
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export const createTokenBridgeEnoughCustomFeeTokenAllowanceSchema =
  createTokenBridgeCustomFeeTokenBaseSchema.strict();

export const createTokenBridgeEnoughCustomFeeTokenAllowanceTransform = (
  input: z.output<typeof createTokenBridgeEnoughCustomFeeTokenAllowanceSchema>,
) =>
  [
    {
      nativeToken: input.nativeToken,
      owner: input.owner,
      publicClient: toPublicClient(input.rpcUrl),
      tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
    },
  ] as const;

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema =
  createTokenBridgeCustomFeeTokenBaseSchema
    .extend({
      amount: bigintSchema.optional(),
    })
    .strict();

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema>,
) =>
  [
    {
      amount: input.amount,
      nativeToken: input.nativeToken,
      owner: input.owner,
      publicClient: toPublicClient(input.rpcUrl),
      tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
    },
  ] as const;
