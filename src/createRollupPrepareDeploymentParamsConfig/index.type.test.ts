import { it, expectTypeOf } from 'vitest';
import { createPublicClient, http } from 'viem';

import { arbitrumOne } from '../chains';
import {
  createRollupPrepareDeploymentParamsConfig,
  CreateRollupPrepareDeploymentParamsConfigResult,
} from './index';

const client = createPublicClient({
  chain: arbitrumOne,
  transport: http(),
});

const baseParams = {
  owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045' as const,
  chainId: 69_420n,
};

it('no version parameter defaults to v3.2 result', () => {
  const result = createRollupPrepareDeploymentParamsConfig(client, baseParams);

  expectTypeOf(result).toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult>();
  expectTypeOf(result).toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult<'v3.2'>>();
  expectTypeOf(result).not.toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult<'v2.1'>>();
});

it('explicit v3.2 parameter uses v3.2 result', () => {
  const result = createRollupPrepareDeploymentParamsConfig(client, baseParams, 'v3.2');

  expectTypeOf(result).toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult>();
  expectTypeOf(result).toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult<'v3.2'>>();
  expectTypeOf(result).not.toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult<'v2.1'>>();
});

it('explicit v2.1 parameter uses v2.1 result', () => {
  const result = createRollupPrepareDeploymentParamsConfig(client, baseParams, 'v2.1');

  expectTypeOf(result).not.toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult>();
  expectTypeOf(result).not.toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult<'v3.2'>>();
  expectTypeOf(result).toEqualTypeOf<CreateRollupPrepareDeploymentParamsConfigResult<'v2.1'>>();
});

it('no version parameter defaults to v3.2 result', () => {
  // this should work
  createRollupPrepareDeploymentParamsConfig(client, {
    ...baseParams,
    challengeGracePeriodBlocks: 1n,
  });

  // this should not work
  createRollupPrepareDeploymentParamsConfig(client, {
    ...baseParams,
    // @ts-expect-error - extraChallengeTimeBlocks not available in v3.2
    extraChallengeTimeBlocks: 1n,
  });
});

it('explicit v3.2 parameter uses v3.2 params', () => {
  // this should work
  createRollupPrepareDeploymentParamsConfig(
    client,
    { ...baseParams, challengeGracePeriodBlocks: 1n },
    'v3.2',
  );

  // this should not work
  createRollupPrepareDeploymentParamsConfig(
    client,
    // @ts-expect-error - extraChallengeTimeBlocks not available in v3.2
    { ...baseParams, extraChallengeTimeBlocks: 1n },
    'v3.2',
  );
});

it('explicit v2.1 parameter uses v2.1 params', () => {
  // this should work
  createRollupPrepareDeploymentParamsConfig(
    client,
    { ...baseParams, extraChallengeTimeBlocks: 1n },
    'v2.1',
  );

  // this should not work
  createRollupPrepareDeploymentParamsConfig(
    client,
    // @ts-expect-error - challengeGracePeriodBlocks not available in v2.1
    { ...baseParams, challengeGracePeriodBlocks: 1n },
    'v2.1',
  );
});
