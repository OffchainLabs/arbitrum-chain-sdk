import { runScript } from '../scriptUtils';
import { getValidatorsSchema } from '../schemas';
import { getValidators } from '../../getValidators';

runScript(getValidatorsSchema, async (args) => getValidators(...args));
