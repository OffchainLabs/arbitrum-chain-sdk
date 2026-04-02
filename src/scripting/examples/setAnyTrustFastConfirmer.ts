import { runScript } from '../runScript';
import { setAnyTrustFastConfirmerSchema, setAnyTrustFastConfirmerTransform } from '../schemas';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

const schema = setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerTransform);

runScript(schema, async (args) => setAnyTrustFastConfirmerPrepareTransactionRequest(...args));
