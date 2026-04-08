import { z } from 'zod';
import { ParentChainId } from '../../types/ParentChain';
import { chainConfigSchema, coreContractsSchema } from './common';
import { prepareNodeConfig } from '../../prepareNodeConfig';

export const prepareNodeConfigSchema = z.strictObject({
  chainName: z.string(),
  chainConfig: chainConfigSchema,
  coreContracts: coreContractsSchema,
  batchPosterPrivateKey: z.string(),
  validatorPrivateKey: z.string(),
  stakeToken: z.string(),
  parentChainId: z.number().transform((n) => n as ParentChainId),
  parentChainIsArbitrum: z.boolean().optional(),
  parentChainRpcUrl: z.url(),
  parentChainBeaconRpcUrl: z.url().optional(),
  dasServerUrl: z.url().optional(),
});

export const prepareNodeConfigTransform = (
  input: z.output<typeof prepareNodeConfigSchema>,
): Parameters<typeof prepareNodeConfig> => [input];
