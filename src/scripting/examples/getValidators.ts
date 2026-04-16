import { runScript } from '../scriptUtils';
import { getValidatorsSchema, getValidatorsResolver } from '../schemas';
import { getValidators } from '../../getValidators';

export const schema = getValidatorsSchema.transform(getValidatorsResolver);

export const execute = async (args: Parameters<typeof getValidators>) => getValidators(...args);

runScript(schema, execute);
