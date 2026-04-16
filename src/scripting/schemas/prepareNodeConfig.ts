import { z } from 'zod';
import { ParentChainId } from '../../types/ParentChain';
import { chainConfigSchema, coreContractsSchema, parentChainPublicClientSchema } from './common';
import { prepareNodeConfig } from '../../prepareNodeConfig';

export const prepareNodeConfigSchema = parentChainPublicClientSchema
  .extend({
    chainName: z.string(),
    chainConfig: chainConfigSchema,
    coreContracts: coreContractsSchema,
    batchPosterPrivateKey: z.string(),
    validatorPrivateKey: z.string(),
    stakeToken: z.string(),
    parentChainId: z.number().transform((n) => n as ParentChainId),
    parentChainIsArbitrum: z.boolean().optional(),
    parentChainBeaconRpcUrl: z.url().optional(),
    dasServerUrl: z.url().optional(),
  })
  .strict()
  .transform((input): Parameters<typeof prepareNodeConfig> => [input]);
