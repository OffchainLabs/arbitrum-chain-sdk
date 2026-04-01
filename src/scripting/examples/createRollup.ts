import { runScript } from '../runScript';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { toPublicClient, toAccount } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { createRollup } from '../../createRollup';

const schema = createRollupDefaultSchema.extend({
  params: createRollupDefaultSchema.shape.params.extend({
    config: paramsV3Dot2Schema,
  }),
});

runScript({
  input: schema,
  async run(input) {
    const parentChainPublicClient = toPublicClient(input.parentChainRpcUrl);
    const { config: configParams, ...params } = input.params;
    const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, configParams);

    const result = await createRollup({
      params: { config, ...params },
      account: toAccount(input.privateKey),
      parentChainPublicClient,
    });
    return result.coreContracts;
  },
});
