import { z } from 'zod';

import type {
  DeployNitroContractsUpgradeActionParameters,
  ExecuteNitroContractsUpgradeParameters,
  NitroContractsUpgradeVersion,
  VerifyNitroContractsUpgradeParameters,
} from '../../nitroContractsUpgrade';
import { addressSchema } from './common';

const nitroContractsUpgradeVersionSchema = z
  .literal('3.2.0')
  .transform((version) => version as NitroContractsUpgradeVersion);

const deployNitroContractsUpgradeActionParamsSchema = z.strictObject({
  version: nitroContractsUpgradeVersionSchema,
  parentChainRpcUrl: z.url(),
  forgeArgs: z.array(z.string()).optional(),
});

export const deployNitroContractsUpgradeActionSchema =
  deployNitroContractsUpgradeActionParamsSchema.transform(
    (params): [DeployNitroContractsUpgradeActionParameters] => [params],
  );

export const executeNitroContractsUpgradeSchema = deployNitroContractsUpgradeActionParamsSchema
  .extend({
    rollupAddress: addressSchema,
    parentUpgradeExecutorAddress: addressSchema,
    upgradeActionAddress: addressSchema,
  })
  .transform((params): [ExecuteNitroContractsUpgradeParameters] => [params]);

export const verifyNitroContractsUpgradeSchema = deployNitroContractsUpgradeActionParamsSchema
  .extend({
    rollupAddress: addressSchema,
  })
  .transform((params): [VerifyNitroContractsUpgradeParameters] => [params]);
