import { runScript } from '../runScript';
import { getValidatorsSchema, getValidatorsTransform } from '../schemas';
import { getValidators } from '../../getValidators';

const schema = getValidatorsSchema.transform(getValidatorsTransform);

runScript({
  input: schema,
  async run(args) {
    return getValidators(...args);
  },
});
