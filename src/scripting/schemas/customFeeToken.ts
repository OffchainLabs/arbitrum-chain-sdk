import { z } from 'zod';
import { toPublicClient, findChain } from '../viemTransforms';
import { addressSchema, bigintSchema, rollupCreatorVersionSchema } from './common';
import { createRollupEnoughCustomFeeTokenAllowance } from '../../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';

const createRollupCustomFeeTokenBaseSchema = z.object({
  rpcUrl: z.url(),
  chainId: z.number(),
  nativeToken: addressSchema,
  account: addressSchema,
  maxFeePerGasForRetryables: bigintSchema.optional(),
  rollupCreatorAddressOverride: addressSchema.optional(),
  rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
});

export const createRollupEnoughCustomFeeTokenAllowanceSchema = z.strictObject(
  createRollupCustomFeeTokenBaseSchema.shape,
);

export const createRollupEnoughCustomFeeTokenAllowanceTransform = (
  input: z.output<typeof createRollupEnoughCustomFeeTokenAllowanceSchema>,
): Parameters<typeof createRollupEnoughCustomFeeTokenAllowance> => [
  {
    nativeToken: input.nativeToken,
    maxFeePerGasForRetryables: input.maxFeePerGasForRetryables,
    account: input.account,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    rollupCreatorAddressOverride: input.rollupCreatorAddressOverride,
    rollupCreatorVersion: input.rollupCreatorVersion,
  },
];

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema = z.strictObject(
  createRollupCustomFeeTokenBaseSchema.extend({
    amount: bigintSchema.optional(),
  }).shape,
);

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema>,
): Parameters<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequest> => [
  {
    amount: input.amount,
    nativeToken: input.nativeToken,
    maxFeePerGasForRetryables: input.maxFeePerGasForRetryables,
    account: input.account,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    rollupCreatorAddressOverride: input.rollupCreatorAddressOverride,
    rollupCreatorVersion: input.rollupCreatorVersion,
  },
];

const createTokenBridgeCustomFeeTokenBaseSchema = z.object({
  rpcUrl: z.url(),
  chainId: z.number(),
  nativeToken: addressSchema,
  owner: addressSchema,
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export const createTokenBridgeEnoughCustomFeeTokenAllowanceSchema = z.strictObject(
  createTokenBridgeCustomFeeTokenBaseSchema.shape,
);

export const createTokenBridgeEnoughCustomFeeTokenAllowanceTransform = (
  input: z.output<typeof createTokenBridgeEnoughCustomFeeTokenAllowanceSchema>,
): Parameters<typeof createTokenBridgeEnoughCustomFeeTokenAllowance> => [
  {
    nativeToken: input.nativeToken,
    owner: input.owner,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema =
  z.strictObject(
    createTokenBridgeCustomFeeTokenBaseSchema.extend({
      amount: bigintSchema.optional(),
    }).shape,
  );

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema>,
): Parameters<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest> => [
  {
    amount: input.amount,
    nativeToken: input.nativeToken,
    owner: input.owner,
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    tokenBridgeCreatorAddressOverride: input.tokenBridgeCreatorAddressOverride,
  },
];
