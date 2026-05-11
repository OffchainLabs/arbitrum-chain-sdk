import { z } from 'zod';
import { addressSchema, bigintSchema } from './common';
import {
  paramsV3Dot2Schema as prepareParamsV3Dot2Schema,
  paramsV2Dot1Schema as prepareParamsV2Dot1Schema,
} from './createRollupPrepareDeploymentParamsConfig';

export const configV3Dot2Schema = prepareParamsV3Dot2Schema
  .omit({ chainConfig: true })
  .required()
  .extend({ chainConfig: z.string() });

export const configV2Dot1Schema = prepareParamsV2Dot1Schema
  .omit({ chainConfig: true })
  .required()
  .extend({ chainConfig: z.string() });

export const paramsV3Dot2Schema = z.strictObject({
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

export const paramsV2Dot1Schema = z.strictObject({
  config: configV2Dot1Schema,
  batchPosters: z.array(addressSchema).min(1),
  validators: z.array(addressSchema).min(1),
  maxDataSize: bigintSchema.optional(),
  nativeToken: addressSchema.optional(),
  deployFactoriesToL2: z.boolean().optional(),
  maxFeePerGasForRetryables: bigintSchema.optional(),
  batchPosterManager: addressSchema.optional(),
});
