import { runScript } from '../scriptUtils';
import { createRollupDefaultSchema } from '../schemas/createRollup';
import { paramsV3Dot2Schema } from '../schemas/createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfigParamsBaseSchema } from '../schemas/prepareChainConfig';
import { toPublicClient, toAccount, findChain } from '../viemTransforms';
import { createRollupPrepareDeploymentParamsConfig } from '../../createRollupPrepareDeploymentParamsConfig';
import { prepareChainConfig } from '../../prepareChainConfig';
import { createRollup } from '../../createRollup';

const schema = createRollupDefaultSchema
  .extend({
    params: createRollupDefaultSchema.shape.params.extend({
      config: paramsV3Dot2Schema.extend({
        chainConfig: prepareChainConfigParamsBaseSchema.optional(),
      }),
    }),
  })
  .transform((input) => {
    const parentChainPublicClient = toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    );
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

runScript(schema, async (input) => {
  const result = await createRollup(input);
  return result.coreContracts;
});
