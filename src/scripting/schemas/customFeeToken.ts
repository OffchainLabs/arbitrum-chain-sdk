import { z } from 'zod';
import { withPublicClient } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  publicClientSchema,
  rollupCreatorVersionSchema,
} from './common';
import { createRollupEnoughCustomFeeTokenAllowance } from '../../createRollupEnoughCustomFeeTokenAllowance';
import { createRollupPrepareCustomFeeTokenApprovalTransactionRequest } from '../../createRollupPrepareCustomFeeTokenApprovalTransactionRequest';
import { createTokenBridgeEnoughCustomFeeTokenAllowance } from '../../createTokenBridgeEnoughCustomFeeTokenAllowance';
import { createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest } from '../../createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequest';

const createRollupCustomFeeTokenBaseSchema = publicClientSchema.extend({
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
  return [withPublicClient(input)];
};

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema = z.strictObject(
  createRollupCustomFeeTokenBaseSchema.extend({
    amount: bigintSchema.optional(),
  }).shape,
);

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestTransform = (
  input: z.output<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema>,
): Parameters<typeof createRollupPrepareCustomFeeTokenApprovalTransactionRequest> => {
  return [withPublicClient(input)];
};

const createTokenBridgeCustomFeeTokenBaseSchema = publicClientSchema.extend({
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
  return [withPublicClient(input)];
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
  return [withPublicClient(input)];
};
