import { runScript } from '../scriptUtils';
import { setAnyTrustFastConfirmerSchema } from '../schemas';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

export const schema = setAnyTrustFastConfirmerSchema;

export const execute = async (
  args: Parameters<typeof setAnyTrustFastConfirmerPrepareTransactionRequest>,
) => setAnyTrustFastConfirmerPrepareTransactionRequest(...args);

runScript(schema, execute);
