import { z } from 'zod';
import { toPublicClient } from '../viemTransforms';
import { addressSchema, bigintSchema, gasOverridesSchema } from './common';
import {
  paramsV3Dot2Schema as prepareParamsV3Dot2Schema,
  paramsV2Dot1Schema as prepareParamsV2Dot1Schema,
} from './createRollupPrepareDeploymentParamsConfig';

const configV3Dot2Schema = prepareParamsV3Dot2Schema
  .omit({ chainConfig: true })
  .required()
  .extend({ chainConfig: z.string() });

const configV2Dot1Schema = prepareParamsV2Dot1Schema
  .omit({ chainConfig: true })
  .required()
  .extend({ chainConfig: z.string() });

const paramsV3Dot2Schema = z.object({
  config: configV3Dot2Schema,
  batchPosters: z.array(addressSchema).min(1),
  validators: z.array(addressSchema).min(1),
  maxDataSize: bigintSchema.optional(),
  nativeToken: addressSchema.optional(),
  deployFactoriesToL2: z.boolean().optional(),
  maxFeePerGasForRetryables: bigintSchema.optional(),
  batchPosterManager: addressSchema.optional(),
  feeTokenPricer: addressSchema.optional(),
  customOsp: addressSchema.optional(),
});

const paramsV2Dot1Schema = z.object({
  config: configV2Dot1Schema,
  batchPosters: z.array(addressSchema).min(1),
  validators: z.array(addressSchema).min(1),
  maxDataSize: bigintSchema.optional(),
  nativeToken: addressSchema.optional(),
  deployFactoriesToL2: z.boolean().optional(),
  maxFeePerGasForRetryables: bigintSchema.optional(),
  batchPosterManager: addressSchema.optional(),
});

const commonFieldsSchema = z.object({
  rpcUrl: z.string().url(),
  account: addressSchema,
  value: bigintSchema.optional(),
  gasOverrides: gasOverridesSchema.optional(),
  rollupCreatorAddressOverride: addressSchema.optional(),
});

export const createRollupPrepareTransactionRequestV21Schema = commonFieldsSchema.extend({
  params: paramsV2Dot1Schema,
  rollupCreatorVersion: z.literal('v2.1'),
}).strict();
export const createRollupPrepareTransactionRequestV32Schema = commonFieldsSchema.extend({
  params: paramsV3Dot2Schema,
  rollupCreatorVersion: z.literal('v3.2'),
}).strict();
export const createRollupPrepareTransactionRequestDefaultSchema = commonFieldsSchema.extend({
  params: paramsV3Dot2Schema,
  rollupCreatorVersion: z.never().optional(),
}).strict();

export const createRollupPrepareTransactionRequestSchema = z.union([
  createRollupPrepareTransactionRequestV21Schema,
  createRollupPrepareTransactionRequestV32Schema,
  createRollupPrepareTransactionRequestDefaultSchema,
]);

export const createRollupPrepareTransactionRequestTransform = <
  T extends z.output<typeof createRollupPrepareTransactionRequestSchema>,
>(input: T) => [{
  params: input.params as T['params'],
  account: input.account,
  value: input.value,
  publicClient: toPublicClient(input.rpcUrl),
  gasOverrides: input.gasOverrides,
  rollupCreatorAddressOverride: input.rollupCreatorAddressOverride,
  rollupCreatorVersion: input.rollupCreatorVersion as T['rollupCreatorVersion'],
}] as const;

export const createRollupPrepareTransactionRequestTransformedSchema = z.union([
  createRollupPrepareTransactionRequestV21Schema.transform(createRollupPrepareTransactionRequestTransform),
  createRollupPrepareTransactionRequestV32Schema.transform(createRollupPrepareTransactionRequestTransform),
  createRollupPrepareTransactionRequestDefaultSchema.transform(createRollupPrepareTransactionRequestTransform),
]);
