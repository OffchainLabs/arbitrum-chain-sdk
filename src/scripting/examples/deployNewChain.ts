import { runScript } from '../runScript';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { hexSchema, bigintSchema, addressSchema } from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigParamsSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount, toWalletClient } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { createRollup } from '../../createRollup';
import { zeroAddress } from 'viem';
import { setValidKeyset } from '../../setValidKeyset';
import { generateChainId } from '../../utils/generateChainId';

const schema = createRollupDefaultSchema.extend({
  params: createRollupDefaultSchema.shape.params.extend({
    config: paramsV3Dot2Schema.extend({
      chainId: bigintSchema.default(() => String(generateChainId())),
      chainConfig: prepareChainConfigParamsSchema.optional(),
    }),
    nativeToken: addressSchema.default(zeroAddress),
    keyset: hexSchema.default('0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'),
  }),
}).transform((input) => {
  const parentChainPublicClient = toPublicClient(input.parentChainRpcUrl);
  const { config: { chainConfig: chainConfigParams, ...restConfig }, keyset, ...params } = input.params;
  const chainConfig = chainConfigParams ? prepareChainConfig(chainConfigParams) : undefined;
  const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
    ...restConfig,
    chainConfig,
  });
  return {
    params: { config, ...params },
    account: toAccount(input.privateKey),
    parentChainPublicClient,
    walletClient: toWalletClient(input.parentChainRpcUrl, input.privateKey),
    keyset,
  };
});

runScript({
  input: schema,
  async run(input) {
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
  },
});
