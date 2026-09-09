import { z } from 'zod';

import { withParentChainPublicClient, withParentChainSign } from '../viemTransforms';
import { addressSchema, parentChainPublicClientSchema, privateKeySchema } from './common';

const nitroContractsUpgradeParamsSchema = parentChainPublicClientSchema.extend({
  version: z.literal('3.2.0'),
});

const deployNitroContractsUpgradeActionParamsSchema = nitroContractsUpgradeParamsSchema.extend({
  privateKey: privateKeySchema,
});

export const deployNitroContractsUpgradeActionSchema =
  deployNitroContractsUpgradeActionParamsSchema.transform(withParentChainSign);

export const executeNitroContractsUpgradeSchema = deployNitroContractsUpgradeActionParamsSchema
  .extend({
    rollupAddress: addressSchema,
    parentUpgradeExecutorAddress: addressSchema,
    upgradeActionAddress: addressSchema,
  })
  .transform(withParentChainSign);

export const verifyNitroContractsUpgradeSchema = nitroContractsUpgradeParamsSchema
  .extend({
    rollupAddress: addressSchema,
  })
  .transform(withParentChainPublicClient);
