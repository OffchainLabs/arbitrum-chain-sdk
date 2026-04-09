import { runScript } from '../scriptUtils';
import { setAnyTrustFastConfirmerSchema, setAnyTrustFastConfirmerTransform } from '../schemas';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

export const schema = setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerTransform);

export const execute = async (args: Parameters<typeof setAnyTrustFastConfirmerPrepareTransactionRequest>) =>
  setAnyTrustFastConfirmerPrepareTransactionRequest(...args);

runScript(schema, execute);
