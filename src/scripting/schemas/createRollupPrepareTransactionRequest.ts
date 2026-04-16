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

const versionedCreateRollupPrepareTransactionRequestSchema = z.discriminatedUnion(
  'rollupCreatorVersion',
  [createRollupPrepareTransactionRequestV21Schema, createRollupPrepareTransactionRequestV32Schema],
);

export const createRollupPrepareTransactionRequestSchema = z.union([
  versionedCreateRollupPrepareTransactionRequestSchema,
  createRollupPrepareTransactionRequestDefaultSchema,
]);

type Params<V extends 'v2.1' | 'v3.2' | undefined> = [
  Extract<
    CreateRollupPrepareTransactionRequestParams<Chain | undefined>,
    V extends undefined ? { rollupCreatorVersion?: never } : { rollupCreatorVersion: V }
  >,
];

const resolveV21 = (
  input: z.output<typeof createRollupPrepareTransactionRequestV21Schema>,
): Params<'v2.1'> => {
  return withPublicClient(input);
};

const resolveV32 = (
  input: z.output<typeof createRollupPrepareTransactionRequestV32Schema>,
): Params<'v3.2'> => {
  return withPublicClient(input);
};

const resolveDefault = (
  input: z.output<typeof createRollupPrepareTransactionRequestDefaultSchema>,
): Params<undefined> => {
  return withPublicClient(input);
};

export const createRollupPrepareTransactionRequestResolver = (
  input: z.output<typeof createRollupPrepareTransactionRequestSchema>,
): [CreateRollupPrepareTransactionRequestParams<Chain | undefined>] => {
  if (input.rollupCreatorVersion === 'v2.1')
    return resolveV21(input as z.output<typeof createRollupPrepareTransactionRequestV21Schema>);
  if (input.rollupCreatorVersion === 'v3.2')
    return resolveV32(input as z.output<typeof createRollupPrepareTransactionRequestV32Schema>);
  return resolveDefault(
    input as z.output<typeof createRollupPrepareTransactionRequestDefaultSchema>,
  );
};

export const createRollupPrepareTransactionRequestTransformedSchema = z.union([
  createRollupPrepareTransactionRequestV21Schema.transform(resolveV21),
  createRollupPrepareTransactionRequestV32Schema.transform(resolveV32),
  createRollupPrepareTransactionRequestDefaultSchema.transform(resolveDefault),
]);
