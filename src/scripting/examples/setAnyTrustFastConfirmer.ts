import { runScript } from '../scriptUtils';
import { setAnyTrustFastConfirmerSchema, setAnyTrustFastConfirmerResolver } from '../schemas';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

export const schema = setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerResolver);

export const execute = async (
  args: Parameters<typeof setAnyTrustFastConfirmerPrepareTransactionRequest>,
) => setAnyTrustFastConfirmerPrepareTransactionRequest(...args);

runScript(schema, execute);
