import { runScript } from '../runScript';
import { getValidatorsSchema, getValidatorsTransform } from '../schemas';
import { getValidators } from '../../getValidators';

const schema = getValidatorsSchema.transform(getValidatorsTransform);

runScript(schema, async (args) => getValidators(...args));
