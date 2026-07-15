import { z } from 'zod';
import { Chain } from 'viem';
import { registerCustomParentChainFromInput, withParentChainSign } from '../viemTransforms';
import { CreateRollupFunctionParams } from '../../createRollup';
import {
  nativeCurrencySchema,
  parentChainContractsSchema,
  parentChainPublicClientSchema,
  privateKeySchema,
} from './common';
import { paramsV3Dot2Schema, paramsV2Dot1Schema } from './createRollupParams';

// createRollup reads the parent chain's rollupCreator, so a custom parent must supply it.
const commonFieldsSchema = parentChainPublicClientSchema.extend({
  privateKey: privateKeySchema,
  parentChainContracts: parentChainContractsSchema({ rollupCreator: true }),
  parentChainName: z.string().optional(),
  parentChainNativeCurrency: nativeCurrencySchema.optional(),
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
  createRollupV21Schema.transform(
    (input): Params<'v2.1'> => withParentChainSign(registerCustomParentChainFromInput(input)),
  ),
  createRollupV32Schema.transform(
    (input): Params<'v3.2'> => withParentChainSign(registerCustomParentChainFromInput(input)),
  ),
  createRollupDefaultSchema.transform(
    (input): Params<undefined> => withParentChainSign(registerCustomParentChainFromInput(input)),
  ),
]);
