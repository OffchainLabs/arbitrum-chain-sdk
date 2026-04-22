import { z } from 'zod';
import { Chain } from 'viem';
import { withParentChainSign } from '../viemTransforms';
import { CreateRollupFunctionParams } from '../../createRollup';
import { parentChainPublicClientSchema, privateKeySchema } from './common';
import { paramsV3Dot2Schema, paramsV2Dot1Schema } from './createRollupParams';

const commonFieldsSchema = parentChainPublicClientSchema.extend({
  privateKey: privateKeySchema,
});

type Params<V extends 'v2.1' | 'v3.2' | undefined> = [
  Extract<
    CreateRollupFunctionParams<Chain | undefined>,
    V extends undefined ? { rollupCreatorVersion?: never } : { rollupCreatorVersion: V }
  >,
];

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

export const createRollupSchema = z.union([
  createRollupV21Schema.transform((input): Params<'v2.1'> => withParentChainSign(input)),
  createRollupV32Schema.transform((input): Params<'v3.2'> => withParentChainSign(input)),
  createRollupDefaultSchema.transform((input): Params<undefined> => withParentChainSign(input)),
]);
