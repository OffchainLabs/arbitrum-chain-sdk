import { runScript } from '../scriptUtils';
import {
  getChainDeploymentInfoSchema,
  getChainDeploymentInfoTransform,
} from '../schemas/getChainDeploymentInfo';
import { getChainDeploymentInfo } from '../../getChainDeploymentInfo';

export const schema = getChainDeploymentInfoSchema.transform(getChainDeploymentInfoTransform);

// rest params for assertSchemaCoverage compat; runScript passes the array as one arg at runtime
export const execute = async (...args: Parameters<typeof getChainDeploymentInfo>) =>
  getChainDeploymentInfo(...args);

// @ts-expect-error -- runScript passes parsed output as a single arg; assertSchemaCoverage spreads
runScript(schema, execute);
