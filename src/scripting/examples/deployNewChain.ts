import { runScript } from '../runScript';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { hexSchema } from '../schemas/common';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { toPublicClient, toAccount, toWalletClient } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { createRollup } from '../../createRollup';
import { setValidKeyset } from '../../setValidKeyset';

const schema = createRollupDefaultSchema.extend({
  params: createRollupDefaultSchema.shape.params.extend({
    config: paramsV3Dot2Schema,
  }),
  keyset: hexSchema.optional(),
}).transform((input) => {
  const parentChainPublicClient = toPublicClient(input.parentChainRpcUrl);
  const { config: configParams, ...params } = input.params;
  const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, configParams);
  return {
    params: { config, ...params },
    account: toAccount(input.privateKey),
    parentChainPublicClient,
    walletClient: toWalletClient(input.parentChainRpcUrl, input.privateKey),
    keyset: input.keyset,
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
