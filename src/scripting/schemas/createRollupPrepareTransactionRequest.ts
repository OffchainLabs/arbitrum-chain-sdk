import { z } from 'zod';
import { Chain } from 'viem';
import { toPublicClient, findChain } from '../viemTransforms';
import { CreateRollupPrepareTransactionRequestParams } from '../../createRollupPrepareTransactionRequest';
import { addressSchema, bigintSchema, gasLimitSchema } from './common';
import { paramsV3Dot2Schema, paramsV2Dot1Schema } from './createRollupParams';

const commonFieldsSchema = z.object({
  rpcUrl: z.url(),
  chainId: z.number(),
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

const transformV21 = (
  input: z.output<typeof createRollupPrepareTransactionRequestV21Schema>,
): Params<'v2.1'> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};

const transformV32 = (
  input: z.output<typeof createRollupPrepareTransactionRequestV32Schema>,
): Params<'v3.2'> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};

const transformDefault = (
  input: z.output<typeof createRollupPrepareTransactionRequestDefaultSchema>,
): Params<undefined> => {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }];
};

export const createRollupPrepareTransactionRequestTransform = (
  input: z.output<typeof createRollupPrepareTransactionRequestSchema>,
): [CreateRollupPrepareTransactionRequestParams<Chain | undefined>] => {
  if (input.rollupCreatorVersion === 'v2.1')
    return transformV21(input as z.output<typeof createRollupPrepareTransactionRequestV21Schema>);
  if (input.rollupCreatorVersion === 'v3.2')
    return transformV32(input as z.output<typeof createRollupPrepareTransactionRequestV32Schema>);
  return transformDefault(
    input as z.output<typeof createRollupPrepareTransactionRequestDefaultSchema>,
  );
};

export const createRollupPrepareTransactionRequestTransformedSchema = z.union([
  createRollupPrepareTransactionRequestV21Schema.transform(transformV21),
  createRollupPrepareTransactionRequestV32Schema.transform(transformV32),
  createRollupPrepareTransactionRequestDefaultSchema.transform(transformDefault),
]);
