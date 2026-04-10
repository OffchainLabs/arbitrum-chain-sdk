// Simulates what a consumer would do: import shared mocks from testing.ts,
// test an existing schema, and add a custom mock for a new SDK function.

import { describe, it, vi } from 'vitest';
import { z } from 'zod';
import { mocks, assertSchemaCoverage } from './testing';

// Consumer adds a mock for their own SDK function that isn't in testing.ts.
// This works because vi.mock is hoisted per-file and mocks is already
// available via the hoisted export from testing.ts.
vi.mock('../sequencerInboxReadContract', () => ({
  sequencerInboxReadContract: mocks.fn('sequencerInboxReadContract', { maxTimeVariation: {} }),
}));

import { getValidatorsSchema, getValidatorsTransform } from './schemas/getValidators';
import { getValidators } from '../getValidators';
import { addressSchema } from './schemas/common';
import { sequencerInboxReadContract } from '../sequencerInboxReadContract';
import { toPublicClient, findChain } from './viemTransforms';

// A custom schema + transform that a consumer might write for their script
const customSchema = z.strictObject({
  rpcUrl: z.url(),
  chainId: z.number(),
  sequencerInbox: addressSchema,
});

const customTransform = (input: z.output<typeof customSchema>) => [
  toPublicClient(input.rpcUrl, findChain(input.chainId)),
  { sequencerInbox: input.sequencerInbox },
] as const;

const customExecute = async (...args: ReturnType<typeof customTransform>) =>
  sequencerInboxReadContract(...args);

describe('consumer schema coverage', () => {
  // Test an existing schema from the SDK -- shared mocks handle everything
  it('getValidators (from shared mocks)', async () => {
    await assertSchemaCoverage(
      getValidatorsSchema.transform(getValidatorsTransform),
      getValidators,
      mocks,
    );
  });

  // Test a custom schema with a consumer-defined mock
  it('custom schema with consumer mock', async () => {
    await assertSchemaCoverage(
      customSchema.transform(customTransform),
      customExecute,
      mocks,
    );
  });
});
