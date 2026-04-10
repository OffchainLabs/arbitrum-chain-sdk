import { z } from 'zod';
import { runScript } from '../scriptUtils';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { hexSchema, bigintSchema, addressSchema } from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigParamsSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount, toWalletClient, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { createRollup } from '../../createRollup';
import { zeroAddress } from 'viem';
import { setValidKeyset } from '../../setValidKeyset';
import { generateChainId } from '../../utils/generateChainId';

export const schema = createRollupDefaultSchema
  .extend({
    params: createRollupDefaultSchema.shape.params.extend({
      config: paramsV3Dot2Schema.extend({
        chainId: bigintSchema.prefault(() => String(generateChainId())),
        chainConfig: prepareChainConfigParamsSchema.optional(),
      }),
      nativeToken: addressSchema.default(zeroAddress),
      keyset: hexSchema.optional(),
    }),
  })
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
  })
  .transform((input) => {
    const parentChainPublicClient = toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    );
    const {
      config: { chainConfig: chainConfigParams, ...restConfig },
      keyset,
      ...params
    } = input.params;
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
      account: toAccount(input.privateKey),
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

runScript(schema, execute);
