import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient, toAccount, findChain } from '../viemTransforms';
import { CreateRollupFunctionParams } from '../../createRollup';
import { parentChainPublicClientSchema, privateKeySchema } from './common';
import { paramsV3Dot2Schema, paramsV2Dot1Schema } from './createRollupParams';

const commonFieldsSchema = parentChainPublicClientSchema.extend({
  privateKey: privateKeySchema,
});

export const createRollupV21Schema = z.strictObject(
  commonFieldsSchema.extend({
    params: paramsV2Dot1Schema,
    rollupCreatorVersion: z.literal('v2.1'),
  }).shape,
);
export const createRollupV32Schema = z.strictObject(
  commonFieldsSchema.extend({
    params: paramsV3Dot2Schema,
    rollupCreatorVersion: z.literal('v3.2'),
  }).shape,
);
export const createRollupDefaultSchema = z.strictObject(
  commonFieldsSchema.extend({
    params: paramsV3Dot2Schema,
    rollupCreatorVersion: z.never().optional(),
  }).shape,
);

const versionedCreateRollupSchema = z.discriminatedUnion('rollupCreatorVersion', [
  createRollupV21Schema,
  createRollupV32Schema,
]);

export const createRollupSchema = z.union([versionedCreateRollupSchema, createRollupDefaultSchema]);

type Params<V extends 'v2.1' | 'v3.2' | undefined> = [
  Extract<
    CreateRollupFunctionParams<Chain | undefined>,
    V extends undefined ? { rollupCreatorVersion?: never } : { rollupCreatorVersion: V }
  >,
];

const transformV21 = (input: z.output<typeof createRollupV21Schema>): Params<'v2.1'> => [
  {
    params: input.params,
    account: toAccount(input.privateKey),
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    rollupCreatorVersion: input.rollupCreatorVersion,
  },
];

const transformV32 = (input: z.output<typeof createRollupV32Schema>): Params<'v3.2'> => [
  {
    params: input.params,
    account: toAccount(input.privateKey),
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    rollupCreatorVersion: input.rollupCreatorVersion,
  },
];

const transformDefault = (input: z.output<typeof createRollupDefaultSchema>): Params<undefined> => [
  {
    params: input.params,
    account: toAccount(input.privateKey),
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    rollupCreatorVersion: input.rollupCreatorVersion,
  },
];

export const createRollupTransform = (
  input: z.output<typeof createRollupSchema>,
): [CreateRollupFunctionParams<Chain | undefined>] => {
  if (input.rollupCreatorVersion === 'v2.1')
    return transformV21(input as z.output<typeof createRollupV21Schema>);
  if (input.rollupCreatorVersion === 'v3.2')
    return transformV32(input as z.output<typeof createRollupV32Schema>);
  return transformDefault(input as z.output<typeof createRollupDefaultSchema>);
};

export const createRollupTransformedSchema = z.union([
  createRollupV21Schema.transform(transformV21),
  createRollupV32Schema.transform(transformV32),
  createRollupDefaultSchema.transform(transformDefault),
]);
