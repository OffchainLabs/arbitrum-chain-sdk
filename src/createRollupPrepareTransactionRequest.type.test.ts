import { it } from 'vitest';
import { PublicClient } from 'viem';

import { createRollupPrepareTransactionRequest } from './createRollupPrepareTransactionRequest';
import { CreateRollupPrepareDeploymentParamsConfigResult } from './createRollupPrepareDeploymentParamsConfig';

const client = {} as PublicClient;
const owner = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const;

const configV2Dot1 = {} as CreateRollupPrepareDeploymentParamsConfigResult<'v2.1'>;
const configV3Dot2 = {} as CreateRollupPrepareDeploymentParamsConfigResult<'v3.2'>;

it('no rollupCreatorVersion parameter accepts v3.2 config (defaults to v3.2)', () => {
  // this should work - v3.2 config with no version
  createRollupPrepareTransactionRequest({
    params: {
      config: configV3Dot2,
      batchPosters: [owner],
      validators: [owner],
    },
    account: owner,
    publicClient: client,
  });

  // this should not work - v2.1 config with no version (defaults to v3.2)
  // @ts-expect-error - v2.1 config should not work with default v3.2 version
  createRollupPrepareTransactionRequest({
    params: {
      config: configV2Dot1,
      batchPosters: [owner],
      validators: [owner],
    },
    account: owner,
    publicClient: client,
  });
});

it('explicit v3.2 rollupCreatorVersion accepts v3.2 config', () => {
  // this should work - v3.2 config with explicit v3.2 version
  createRollupPrepareTransactionRequest({
    params: {
      config: configV3Dot2,
      batchPosters: [owner],
      validators: [owner],
    },
    account: owner,
    publicClient: client,
    rollupCreatorVersion: 'v3.2',
  });

  // this should not work - v2.1 config with v3.2 version
  // @ts-expect-error - v2.1 config should not work with v3.2 version
  createRollupPrepareTransactionRequest({
    params: {
      config: configV2Dot1,
      batchPosters: [owner],
      validators: [owner],
    },
    account: owner,
    publicClient: client,
    rollupCreatorVersion: 'v3.2',
  });
});

it('explicit v2.1 rollupCreatorVersion accepts v2.1 config', () => {
  // this should work - v2.1 config with explicit v2.1 version
  createRollupPrepareTransactionRequest({
    params: {
      config: configV2Dot1,
      batchPosters: [owner],
      validators: [owner],
    },
    account: owner,
    publicClient: client,
    rollupCreatorVersion: 'v2.1',
  });

  // this should not work - v3.2 config with v2.1 version
  // @ts-expect-error - v3.2 config should not work with v2.1 version
  createRollupPrepareTransactionRequest({
    params: {
      config: configV3Dot2,
      batchPosters: [owner],
      validators: [owner],
    },
    account: owner,
    publicClient: client,
    rollupCreatorVersion: 'v2.1',
  });
});
