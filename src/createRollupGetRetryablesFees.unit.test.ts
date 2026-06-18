import { it, expect } from 'vitest';
import { createPublicClient, http, parseGwei } from 'viem';
import { sepolia } from 'viem/chains';

import { createRollupGetRetryablesFees } from './createRollupGetRetryablesFees';

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
});

it('successfully fetches retryable fees for an eth-based chain (latest)', async () => {
  const fees = await createRollupGetRetryablesFees(sepoliaClient, {
    account: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
    maxFeePerGasForRetryables: parseGwei('0.1'),
  });

  expect(fees).toBeTypeOf('bigint');
  expect(fees).toBeGreaterThanOrEqual(124708400000000000n);
});

it('successfully fetches retryable fees for a custom gas token chain (latest)', async () => {
  const fees = await createRollupGetRetryablesFees(sepoliaClient, {
    account: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
    nativeToken: '0x0625afb445c3b6b7b929342a04a22599fd5dbb59',
    maxFeePerGasForRetryables: parseGwei('0.1'),
  });

  expect(fees).toBeTypeOf('bigint');
  expect(fees).toEqual(124800000000000000n);
});

it('successfully fetches retryable fees for an eth-based chain (v2.1)', async () => {
  const fees = await createRollupGetRetryablesFees(
    sepoliaClient,
    {
      account: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
      maxFeePerGasForRetryables: parseGwei('0.1'),
    },
    'v2.1',
  );

  expect(fees).toBeTypeOf('bigint');
  expect(fees).toBeGreaterThanOrEqual(124708400000000000n);
});

it('successfully fetches retryable fees for a custom gas token chain (v2.1)', async () => {
  const fees = await createRollupGetRetryablesFees(
    sepoliaClient,
    {
      account: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
      nativeToken: '0x0625afb445c3b6b7b929342a04a22599fd5dbb59',
      maxFeePerGasForRetryables: parseGwei('0.1'),
    },
    'v2.1',
  );

  expect(fees).toBeTypeOf('bigint');
  expect(fees).toEqual(124800000000000000n);
});

it('successfully fetches retryable fees for an eth-based chain (v3.2)', async () => {
  const fees = await createRollupGetRetryablesFees(
    sepoliaClient,
    {
      account: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
      maxFeePerGasForRetryables: parseGwei('0.1'),
    },
    'v3.2',
  );

  expect(fees).toBeTypeOf('bigint');
  expect(fees).toBeGreaterThanOrEqual(124708400000000000n);
});

it('successfully fetches retryable fees for a custom gas token chain (v3.2)', async () => {
  const fees = await createRollupGetRetryablesFees(
    sepoliaClient,
    {
      account: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
      nativeToken: '0x0625afb445c3b6b7b929342a04a22599fd5dbb59',
      maxFeePerGasForRetryables: parseGwei('0.1'),
    },
    'v3.2',
  );

  expect(fees).toBeTypeOf('bigint');
  expect(fees).toEqual(124800000000000000n);
});
