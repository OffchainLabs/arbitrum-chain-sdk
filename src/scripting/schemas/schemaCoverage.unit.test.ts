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
import { assertSchemaCoverage } from './schemaCoverage';

describe('schema coverage', () => {
  describe('getValidators', () => {
    it('all schema fields affect transform output', () => {
      assertSchemaCoverage(getValidatorsSchema, getValidatorsTransform, getValidators);
    });
  });
});
