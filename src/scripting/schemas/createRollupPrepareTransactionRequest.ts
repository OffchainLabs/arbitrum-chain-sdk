import { z } from 'zod';
import { Chain } from 'viem';
import { withPublicClient } from '../viemTransforms';
import { CreateRollupPrepareTransactionRequestParams } from '../../createRollupPrepareTransactionRequest';
import { addressSchema, bigintSchema, gasLimitSchema, publicClientSchema } from './common';
import { paramsV3Dot2Schema, paramsV2Dot1Schema } from './createRollupParams';

const commonFieldsSchema = publicClientSchema.extend({
  account: addressSchema,
  value: bigintSchema.optional(),
  gasOverrides: gasLimitSchema.optional(),
  rollupCreatorAddressOverride: addressSchema.optional(),
});

export const createRollupPrepareTransactionRequestV21Schema = z.strictObject(
  commonFieldsSchema.extend({
    params: paramsV2Dot1Schema,
    rollupCreatorVersion: z.literal('v2.1'),
  }).shape,
);
export const createRollupPrepareTransactionRequestV32Schema = z.strictObject(
  commonFieldsSchema.extend({
    params: paramsV3Dot2Schema,
    rollupCreatorVersion: z.literal('v3.2'),
  }).shape,
);
export const createRollupPrepareTransactionRequestDefaultSchema = z.strictObject(
  commonFieldsSchema.extend({
    params: paramsV3Dot2Schema,
    rollupCreatorVersion: z.never().optional(),
  }).shape,
);

type Params<V extends 'v2.1' | 'v3.2' | undefined> = [
  Extract<
    CreateRollupPrepareTransactionRequestParams<Chain | undefined>,
    V extends undefined ? { rollupCreatorVersion?: never } : { rollupCreatorVersion: V }
  >,
];

export const createRollupPrepareTransactionRequestSchema = z.union([
  createRollupPrepareTransactionRequestV21Schema.transform(
    (input): Params<'v2.1'> => withPublicClient(input),
  ),
  createRollupPrepareTransactionRequestV32Schema.transform(
    (input): Params<'v3.2'> => withPublicClient(input),
  ),
  createRollupPrepareTransactionRequestDefaultSchema.transform(
    (input): Params<undefined> => withPublicClient(input),
  ),
]);