// Simulates what a consumer would do: import shared mocks from testing.ts,
// test an existing schema, and add a custom mock for a new SDK function.

import { describe, it, vi } from 'vitest';
import { z } from 'zod';
import { mocks, assertSchemaCoverage } from './testing';

// Consumer adds a mock for their own SDK function that isn't in testing.ts.
vi.mock('../createRollupGetCallValue', () => ({
  createRollupGetCallValue: mocks.fn('createRollupGetCallValue', 0n),
}));

import { getValidatorsSchema, getValidatorsTransform } from './schemas/getValidators';
import { getValidators } from '../getValidators';
import { addressSchema } from './schemas/common';
import { createRollupGetCallValue } from '../createRollupGetCallValue';
import { toPublicClient, findChain } from './viemTransforms';

const customSchema = z
  .strictObject({
    rpcUrl: z.url(),
    chainId: z.number(),
    account: addressSchema,
    nativeToken: addressSchema,
    deployFactoriesToL2: z.boolean(),
  })
  .transform((input) => ({
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    params: {
      account: input.account,
      nativeToken: input.nativeToken,
      deployFactoriesToL2: input.deployFactoriesToL2,
    },
  }));

const customExecute = (input: z.output<typeof customSchema>) =>
  createRollupGetCallValue(input.publicClient, input.params);

describe('consumer schema coverage', () => {
  it('getValidators (from shared mocks)', async () => {
    await assertSchemaCoverage(
      getValidatorsSchema.transform(getValidatorsTransform),
      getValidators,
      mocks,
    );
  });

  it('custom schema with consumer mock', async () => {
    await assertSchemaCoverage(customSchema, customExecute, mocks);
  });
});
