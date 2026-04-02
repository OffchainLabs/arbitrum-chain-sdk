import { runScript } from '../runScript';
import { setAnyTrustFastConfirmerSchema, setAnyTrustFastConfirmerTransform } from '../schemas';
import { setAnyTrustFastConfirmerPrepareTransactionRequest } from '../../setAnyTrustFastConfirmerPrepareTransactionRequest';

const schema = setAnyTrustFastConfirmerSchema.transform(setAnyTrustFastConfirmerTransform);

runScript({
  input: schema,
  async run(args) {
    return setAnyTrustFastConfirmerPrepareTransactionRequest(...args);
  },
});
