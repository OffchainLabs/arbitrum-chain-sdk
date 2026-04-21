import { z } from 'zod';

import { createRollupDefaultSchema } from '../schemas/createRollup';
import {
  hexSchema,
  bigintSchema,
  addressSchema,
  prepareChainConfigArbitrumParamsSchema,
} from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { createRollup } from '../../createRollup';
import { zeroAddress } from 'viem';
import { setValidKeyset } from '../../setValidKeyset';
import { generateChainId } from '../../utils/generateChainId';

// InitialChainOwner defaults to the deployer address in the workflow transform.
const chainConfigInputSchemaWithOptionalOwner = z.strictObject({
  chainId: z.number(),
  arbitrum: prepareChainConfigArbitrumParamsSchema
    .omit({ InitialChainOwner: true })
    .extend({ InitialChainOwner: addressSchema.optional() })
    .optional(),
});

export const inputSchema = createRollupDefaultSchema.extend({
  params: createRollupDefaultSchema.shape.params.extend({
    config: paramsV3Dot2Schema.extend({
      owner: addressSchema.optional(),
      chainId: bigintSchema.prefault(() => String(generateChainId())),
      chainConfig: chainConfigInputSchemaWithOptionalOwner.optional(),
    }),
    nativeToken: addressSchema.default(zeroAddress),
    keyset: hexSchema.optional(),
  }),
});

export const schema = inputSchema
  .superRefine((data, ctx) => {
    const isAnytrust =
      data.params.config.chainConfig?.arbitrum?.DataAvailabilityCommittee === true;
    if (data.params.keyset && !isAnytrust) {
      ctx.addIssue({
        code: 'custom',
        path: ['params', 'keyset'],
        message:
          'keyset provided but chain is not AnyTrust (DataAvailabilityCommittee is not true)',
      });
    }
  })
  .transform((input) => {
    const parentChainPublicClient = toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    );
    const account = toAccount(input.privateKey);
    const {
      config: { chainConfig: rawChainConfigParams, owner: rawOwner, ...restConfigRest },
      keyset,
      ...params
    } = input.params;
    const restConfig = { ...restConfigRest, owner: rawOwner ?? account.address };
    const chainConfigParams = rawChainConfigParams
      ? {
          ...rawChainConfigParams,
          arbitrum: {
            ...rawChainConfigParams.arbitrum,
            InitialChainOwner:
              rawChainConfigParams.arbitrum?.InitialChainOwner ?? account.address,
          },
        }
      : undefined;
    const chainConfig = chainConfigParams ? prepareChainConfig(chainConfigParams) : undefined;
    const isAnytrust = chainConfigParams?.arbitrum?.DataAvailabilityCommittee === true;
    const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
      ...restConfig,
      chainConfig,
    });

    const DEFAULT_KEYSET: `0x${string}` =
      '0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

    return {
      params: { config, ...params },
      account,
      parentChainPublicClient,
      walletClient: toWalletClient(
        input.parentChainRpcUrl,
        input.privateKey,
        findChain(input.parentChainId),
      ),
      keyset: isAnytrust ? keyset ?? DEFAULT_KEYSET : undefined,
    };
  });

export const execute = async (input: z.output<typeof schema>) => {
  const { keyset, walletClient, ...createRollupArgs } = input;
  const result = await createRollup(createRollupArgs);
  const coreContracts = result.coreContracts;

  if (keyset) {
    await setValidKeyset({
      keyset,
      publicClient: createRollupArgs.parentChainPublicClient,
      walletClient,
      coreContracts,
    });
  }

  return coreContracts;
};
