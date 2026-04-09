import { describe, it, vi } from 'vitest';

vi.mock('../viemTransforms', () => ({
  toPublicClient: (rpcUrl: string, chain: unknown) => ({ _type: 'PublicClient', rpcUrl, chain }),
  findChain: (chainId: number) => ({ _type: 'Chain', id: chainId }),
  toAccount: (pk: string) => ({ _type: 'Account', privateKey: pk }),
  toWalletClient: (rpcUrl: string, pk: string, chain: unknown) => ({
    _type: 'WalletClient',
    rpcUrl,
    privateKey: pk,
    chain,
  }),
}));

import { getValidatorsSchema, getValidatorsTransform } from './getValidators';
import { getValidators } from '../../getValidators';
import {
  setValidKeysetPrepareTransactionRequestSchema,
  setValidKeysetPrepareTransactionRequestTransform,
} from './setValidKeysetPrepareTransactionRequest';
import { setValidKeysetPrepareTransactionRequest } from '../../setValidKeysetPrepareTransactionRequest';
import { assertSchemaCoverage } from './schemaCoverage';

describe('schema coverage', () => {
  it('getValidators', () => {
    assertSchemaCoverage(getValidatorsSchema, getValidatorsTransform, getValidators);
  });

  it('setValidKeysetPrepareTransactionRequest', () => {
    assertSchemaCoverage(
      setValidKeysetPrepareTransactionRequestSchema,
      setValidKeysetPrepareTransactionRequestTransform,
      setValidKeysetPrepareTransactionRequest,
    );
  });
});
