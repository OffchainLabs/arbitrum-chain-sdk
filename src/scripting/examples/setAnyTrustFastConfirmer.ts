import { runScript } from '../scriptUtils';
import { setAnyTrustFastConfirmerSchema } from '../schemas';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

runScript(setAnyTrustFastConfirmerSchema, async (args) =>
  setAnyTrustFastConfirmerPrepareTransactionRequest(...args),
);
