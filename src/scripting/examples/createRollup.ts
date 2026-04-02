import { runScript } from '../runScript';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigParamsSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { createRollup } from '../../createRollup';

const schema = createRollupDefaultSchema
  .extend({
    params: createRollupDefaultSchema.shape.params.extend({
      config: paramsV3Dot2Schema.extend({
        chainConfig: prepareChainConfigParamsSchema.optional(),
      }),
    }),
  })
  .transform((input) => {
    const parentChainPublicClient = toPublicClient(input.parentChainRpcUrl);
    const {
      config: { chainConfig: chainConfigParams, ...restConfig },
      ...params
    } = input.params;
    const chainConfig = chainConfigParams ? prepareChainConfig(chainConfigParams) : undefined;
    const config = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
      ...restConfig,
      chainConfig,
    });
    return {
      params: { config, ...params },
      account: toAccount(input.privateKey),
      parentChainPublicClient,
    };
  });

runScript({
  input: schema,
  async run(input) {
    const result = await createRollup(input);
    return result.coreContracts;
  },
});
