import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient, toAccount } from '../viemTransforms';
import { CreateRollupFunctionParams } from '../../createRollup';
import { addressSchema, bigintSchema } from './common';
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
  parentChainRpcUrl: z.string().url(),
  privateKey: z.string().startsWith('0x'),
});

export const createRollupV21Schema = commonFieldsSchema.extend({
  params: paramsV2Dot1Schema,
  rollupCreatorVersion: z.literal('v2.1'),
}).strict();
export const createRollupV32Schema = commonFieldsSchema.extend({
  params: paramsV3Dot2Schema,
  rollupCreatorVersion: z.literal('v3.2'),
}).strict();
export const createRollupDefaultSchema = commonFieldsSchema.extend({
  params: paramsV3Dot2Schema,
  rollupCreatorVersion: z.never().optional(),
}).strict();

export const createRollupSchema = z.union([
  createRollupV21Schema,
  createRollupV32Schema,
  createRollupDefaultSchema,
]);

type Params<V extends 'v2.1' | 'v3.2' | undefined> = [Extract<
  CreateRollupFunctionParams<Chain | undefined>,
  V extends undefined ? { rollupCreatorVersion?: never } : { rollupCreatorVersion: V }
>];

const transformV21 = (input: z.output<typeof createRollupV21Schema>): Params<'v2.1'> => [{
  params: input.params,
  account: toAccount(input.privateKey),
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  rollupCreatorVersion: input.rollupCreatorVersion,
}];

const transformV32 = (input: z.output<typeof createRollupV32Schema>): Params<'v3.2'> => [{
  params: input.params,
  account: toAccount(input.privateKey),
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  rollupCreatorVersion: input.rollupCreatorVersion,
}];

const transformDefault = (input: z.output<typeof createRollupDefaultSchema>): Params<undefined> => [{
  params: input.params,
  account: toAccount(input.privateKey),
  parentChainPublicClient: toPublicClient(input.parentChainRpcUrl),
  rollupCreatorVersion: input.rollupCreatorVersion,
}];

export const createRollupTransform = (
  input: z.output<typeof createRollupSchema>,
): [CreateRollupFunctionParams<Chain | undefined>] => {
  if (input.rollupCreatorVersion === 'v2.1') return transformV21(input as z.output<typeof createRollupV21Schema>);
  if (input.rollupCreatorVersion === 'v3.2') return transformV32(input as z.output<typeof createRollupV32Schema>);
  return transformDefault(input as z.output<typeof createRollupDefaultSchema>);
};

export const createRollupTransformedSchema = z.union([
  createRollupV21Schema.transform(transformV21),
  createRollupV32Schema.transform(transformV32),
  createRollupDefaultSchema.transform(transformDefault),
]);
