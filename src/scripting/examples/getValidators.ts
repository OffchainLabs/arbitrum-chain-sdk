import { runScript } from '../scriptUtils';
import { getValidatorsSchema } from '../schemas';
import { getValidators } from '../../getValidators';

export const schema = getValidatorsSchema;

export const execute = async (args: Parameters<typeof getValidators>) => getValidators(...args);

runScript(schema, execute);
