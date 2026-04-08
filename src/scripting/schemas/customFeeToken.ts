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
): Parameters<typeof createRollupEnoughCustomFeeTokenAllowance> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema = z.strictObject(
  createRollupCustomFeeTokenBaseSchema.extend({
    amount: bigintSchema.optional(),
  }).shape,
);

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema>,
): Parameters<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequest> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};

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
): Parameters<typeof createTokenBridgeEnoughCustomFeeTokenAllowance> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema =
  z.strictObject(
    createTokenBridgeCustomFeeTokenBaseSchema.extend({
      amount: bigintSchema.optional(),
    }).shape,
  );

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema>,
): Parameters<typeof createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};
