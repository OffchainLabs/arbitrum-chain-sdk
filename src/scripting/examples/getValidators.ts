import { runScript } from '../scriptUtils';
import { getValidatorsSchema, getValidatorsTransform } from '../schemas';
import { getValidators } from '../../getValidators';

export const schema = getValidatorsSchema.transform(getValidatorsTransform);

export const execute = async (args: Parameters<typeof getValidators>) => getValidators(...args);

runScript(schema, execute);
