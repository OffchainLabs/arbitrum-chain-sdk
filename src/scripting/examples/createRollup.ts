import { runScript } from '../runScript';
import { createRollupTransformedSchema } from '../schemas/createRollup';
import { createRollup } from '../../createRollup';

runScript({
  input: createRollupTransformedSchema,
  async run([params]) {
    const result = await createRollup({ ...params });
    return result.coreContracts;
  },
});
