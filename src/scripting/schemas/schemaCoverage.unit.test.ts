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

// Prevent runScript from firing when importing example scripts.
// Examples call runScript at module level, which reads process.argv and exits.
vi.mock('../scriptUtils', () => ({ runScript: () => {} }));

// The createRollup example's schema transform calls these SDK functions.
// Mock them to return deterministic values based on their inputs.
vi.mock('../../createRollupPrepareDeploymentParamsConfig', () => ({
  createRollupPrepareDeploymentParamsConfig: (_client: unknown, params: unknown) => ({
    _mock: 'deploymentParamsConfig',
    params,
  }),
}));
vi.mock('../../prepareChainConfig', () => ({
  prepareChainConfig: (params: unknown) => ({ _mock: 'chainConfig', params }),
}));

// Mock SDK functions called by example scripts so execute can run
vi.mock('../../createRollup', () => ({
  createRollup: vi.fn().mockResolvedValue({ coreContracts: {} }),
}));

import { createRollup } from '../../createRollup';
import {
  schema as createRollupExampleSchema,
  execute as createRollupExecute,
} from '../examples/createRollup';
import { schema as transferOwnershipSchema, execute as transferOwnershipExecute } from '../examples/transferOwnership';

describe('schema coverage', () => {
  it('getValidators', async () => {
    await assertSchemaCoverage(
      getValidatorsSchema.transform(getValidatorsTransform),
      getValidators,
    );
  });

  it('setValidKeysetPrepareTransactionRequest', async () => {
    await assertSchemaCoverage(
      setValidKeysetPrepareTransactionRequestSchema.transform(
        setValidKeysetPrepareTransactionRequestTransform,
      ),
      setValidKeysetPrepareTransactionRequest,
    );
  });

  it('createRollup example', async () => {
    await assertSchemaCoverage(createRollupExampleSchema, createRollup, createRollupExecute);
  });

  it('transferOwnership example', async () => {
    await assertSchemaCoverage(transferOwnershipSchema, transferOwnershipExecute);
  });
});
