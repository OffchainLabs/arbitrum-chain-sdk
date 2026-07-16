import { z } from 'zod';
import { DEFAULT_KEYSET } from './defaultKeyset';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { hexSchema, bigintSchema, addressSchema, chainConfigInputSchema } from '../schemas/common';
import {
  paramsV3Dot2Schema,
  refineChainIdMatch,
  refineV3Dot2CustomGenesis,
} from '../schemas/createRollupPrepareDeploymentParamsConfig';
import {
  toPublicClient,
  toAccount,
  toWalletClient,
  findChain,
  registerCustomParentChainFromInput,
} from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { createRollup } from '../../createRollup';
import { zeroAddress } from 'viem';
import { setValidKeyset } from '../../setValidKeyset';

export const inputSchema = createRollupDefaultSchema.extend({
  params: createRollupDefaultSchema.shape.params.extend({
    config: paramsV3Dot2Schema.extend({
      owner: addressSchema.optional(),
      chainId: bigintSchema,
      // chainConfig accepts either the tunable subset or a full ChainConfig
      // pasted from genesis.json; see chainConfigInputSchema for details.
      // InitialChainOwner defaults to the deployer address in the workflow transform.
      chainConfig: chainConfigInputSchema.optional(),
    }),
    nativeToken: addressSchema.default(zeroAddress),
    keyset: hexSchema.optional(),
  }),
});

export const schema = inputSchema
  .superRefine((data, ctx) => {
    const isAnytrust = data.params.config.chainConfig?.arbitrum?.DataAvailabilityCommittee === true;
    if (data.params.keyset && !isAnytrust) {
      ctx.addIssue({
        code: 'custom',
        path: ['params', 'keyset'],
        message:
          'keyset provided but chain is not AnyTrust (DataAvailabilityCommittee is not true)',
      });
    }
    refineV3Dot2CustomGenesis(data.params.config, ctx, ['params', 'config']);
    refineChainIdMatch(data.params.config, ctx, ['params', 'config']);
  })
  .transform((input) => {
    // Register the custom parent chain (if supplied) before findChain resolves it.
    const registered = registerCustomParentChainFromInput(input);
    const parentChainPublicClient = toPublicClient(
      registered.parentChainRpcUrl,
      findChain(registered.parentChainId),
    );
    const account = toAccount(registered.privateKey);
    const {
      config: { chainConfig: rawChainConfigParams, owner: rawOwner, ...restConfigRest },
      keyset,
      ...params
    } = registered.params;
    const restConfig = { ...restConfigRest, owner: rawOwner ?? account.address };
    const chainConfigParams = rawChainConfigParams
      ? {
          ...rawChainConfigParams,
          arbitrum: {
            ...rawChainConfigParams.arbitrum,
            InitialChainOwner: rawChainConfigParams.arbitrum?.InitialChainOwner ?? account.address,
          },
        }
      : undefined;
    const chainConfig = chainConfigParams ? prepareChainConfig(chainConfigParams) : undefined;
    const isAnytrust = chainConfigParams?.arbitrum?.DataAvailabilityCommittee === true;
    const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
      ...restConfig,
      chainConfig,
    });

    return {
      params: { config, ...params },
      account,
      parentChainPublicClient,
      walletClient: toWalletClient(
        registered.parentChainRpcUrl,
        registered.privateKey,
        findChain(registered.parentChainId),
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
