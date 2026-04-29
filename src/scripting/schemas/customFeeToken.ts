import { z } from 'zod';
import { withPublicClient } from '../viemTransforms';
import {
  addressSchema,
  bigintSchema,
  publicClientSchema,
  rollupCreatorVersionSchema,
} from './common';

const createRollupCustomFeeTokenBaseSchema = publicClientSchema.extend({
  nativeToken: addressSchema,
  account: addressSchema,
  maxFeePerGasForRetryables: bigintSchema.optional(),
  rollupCreatorAddressOverride: addressSchema.optional(),
  rollupCreatorVersion: rollupCreatorVersionSchema.optional(),
});

export const createRollupEnoughCustomFeeTokenAllowanceSchema = z
  .strictObject(createRollupCustomFeeTokenBaseSchema.shape)
  .transform(withPublicClient);

export const createRollupPrepareCustomFeeTokenApprovalTransactionRequestSchema = z
  .strictObject(
    createRollupCustomFeeTokenBaseSchema.extend({
      amount: bigintSchema.optional(),
    }).shape,
  )
  .transform(withPublicClient);

const createTokenBridgeCustomFeeTokenBaseSchema = publicClientSchema.extend({
  nativeToken: addressSchema,
  owner: addressSchema,
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export const createTokenBridgeEnoughCustomFeeTokenAllowanceSchema = z
  .strictObject(createTokenBridgeCustomFeeTokenBaseSchema.shape)
  .transform(withPublicClient);

export const createTokenBridgePrepareCustomFeeTokenApprovalTransactionRequestSchema = z
  .strictObject(
    createTokenBridgeCustomFeeTokenBaseSchema.extend({
      amount: bigintSchema.optional(),
    }).shape,
  )
  .transform(withPublicClient);
