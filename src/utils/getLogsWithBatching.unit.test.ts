import { createPublicClient, http, Hash, Log } from 'viem';
import { AbiEvent } from 'abitype';
import { arbitrumSepolia } from 'viem/chains';
import { it, expect, vi, describe, beforeEach } from 'vitest';

import { getLogsWithBatching } from './getLogsWithBatching';

function mockCreateRollupEvent(transactionHash: Hash, blockNumber: bigint): Log {
  return {
    address: '0x193e2887031c148ab54f5e856ea51ae521661200',
    blockHash: '0x3bafb9574d8a3a7c09070935dc3ca936a5df06e2abd09cbd2a3cd489562e748f',
    blockNumber,
    data: '0x',
    logIndex: 42,
    removed: false,
    topics: [
      '0xea8787f128d10b2cc0317b0c3960f9ad447f7f6c1ed189db1083ccffd20f456e',
      '0x0000000000000000000000000000000000000000000000000000000000000006',
    ],
    transactionHash,
    transactionIndex: 3,
  };
}

const rollupAddress = '0xe0875cbd144fe66c015a95e5b2d2c15c3b612179';
const RollupInitializedEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      internalType: 'bytes32',
      name: 'machineHash',
      type: 'bytes32',
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'chainId',
      type: 'uint256',
    },
  ],
  name: 'RollupInitialized',
  type: 'event',
} as const satisfies AbiEvent;

const latestBlock = 2_000_000n;
const client = createPublicClient({ transport: http(), chain: arbitrumSepolia });
const getLogsMock = vi.spyOn(client, 'getLogs');
const getBlockNumberMock = vi.spyOn(client, 'getBlockNumber');
const params = { address: rollupAddress, event: RollupInitializedEventAbi } as const;

beforeEach(() => {
  getLogsMock.mockReset().mockResolvedValue([]);
  getBlockNumberMock.mockReset().mockResolvedValue(latestBlock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

it('defaults to genesis through the latest block when bounds are omitted', async () => {
  await getLogsWithBatching(client, params);

  expect(getBlockNumberMock).toHaveBeenCalledOnce();
  expect(getLogsMock.mock.calls.map(([range]) => [range?.fromBlock, range?.toBlock])).toEqual([
    [1_000_001n, latestBlock],
    [1n, 1_000_000n],
    [0n, 0n],
  ]);
});

describe('starting batch size', () => {
  it.each([
    [1n, 2_000n],
    [999n, 2_000n],
    [1_000n, 2_000n],
    [1_001n, 2_000n],
    [2_000n, 2_000n],
    [2_001n, 10_000n],
    [10_000n, 10_000n],
    [10_001n, 100_000n],
    [100_000n, 100_000n],
    [100_001n, 1_000_000n],
    [1_000_000n, 1_000_000n],
    [1_000_001n, 1_000_000n],
  ])('selects %s blocks using a %s block batch size', async (rangeSize, startingBatchSize) => {
    const fromBlock = latestBlock - rangeSize + 1n;
    // Fail the first request so the next size reveals which starting tier was selected.
    getLogsMock.mockRejectedValueOnce(new Error('RPC limit exceeded'));
    const request = getLogsWithBatching(client, { ...params, fromBlock, toBlock: latestBlock });
    if (startingBatchSize === 2_000n) {
      await expect(request).rejects.toThrow('RPC limit exceeded');
      expect(getLogsMock).toHaveBeenCalledOnce();
    } else {
      await request;
      const smallerSizes = [100_000n, 10_000n, 2_000n];
      const retrySize = smallerSizes.find((size) => size < startingBatchSize)!;
      expect(getLogsMock.mock.calls[1][0]).toMatchObject({
        fromBlock: latestBlock - retrySize + 1n,
        toBlock: latestBlock,
      });
    }
    expect(getLogsMock.mock.calls[0][0]).toMatchObject({
      fromBlock: latestBlock - (rangeSize < startingBatchSize ? rangeSize : startingBatchSize) + 1n,
      toBlock: latestBlock,
    });
    expect(getBlockNumberMock).not.toHaveBeenCalled();
  });
});

it('returns all events when the range fits in a single batch', async () => {
  const event = mockCreateRollupEvent('0x01', latestBlock - 25_000n);
  getLogsMock.mockResolvedValueOnce([event]);

  const logs = await getLogsWithBatching(client, {
    ...params,
    fromBlock: latestBlock - 35_000n,
    toBlock: latestBlock,
  });

  expect(getLogsMock).toHaveBeenCalledOnce();
  expect(getLogsMock).toHaveBeenCalledWith({
    ...params,
    fromBlock: latestBlock - 35_000n,
    toBlock: latestBlock,
  });
  expect(logs).toEqual([event]);
});

it('falls back through every size and throws when 2k batches fail', async () => {
  const error = new Error('RPC limit exceeded');
  getLogsMock.mockRejectedValue(error);

  await expect(
    getLogsWithBatching(client, { ...params, fromBlock: 0n, toBlock: latestBlock }),
  ).rejects.toBe(error);

  expect(
    getLogsMock.mock.calls.map(
      ([range]) => BigInt(range!.toBlock!) - BigInt(range!.fromBlock!) + 1n,
    ),
  ).toEqual([1_000_000n, 100_000n, 10_000n, 2_000n]);
});

it('preserves collected events and retries the failed cursor without gaps or duplicates', async () => {
  const recentEvent = mockCreateRollupEvent('0x01', 200_000n);
  const olderEvent = mockCreateRollupEvent('0x02', 100_000n);
  getLogsMock
    .mockResolvedValueOnce([recentEvent])
    .mockRejectedValueOnce(new Error('RPC limit exceeded'))
    .mockResolvedValueOnce([olderEvent]);

  const logs = await getLogsWithBatching(client, { ...params, fromBlock: 0n, toBlock: 1_100_000n });

  expect(logs).toEqual([olderEvent, recentEvent]);
  expect(getLogsMock.mock.calls.map(([range]) => [range?.fromBlock, range?.toBlock])).toEqual([
    [100_001n, 1_100_000n],
    [0n, 100_000n],
    [1n, 100_000n],
    [0n, 0n],
  ]);
});

it('skips fallback sizes that cannot shrink a failed partial batch', async () => {
  getLogsMock.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('RPC limit exceeded'));

  await getLogsWithBatching(client, { ...params, fromBlock: 0n, toBlock: 1_003_499n });

  expect(getLogsMock.mock.calls.map(([range]) => [range?.fromBlock, range?.toBlock])).toEqual([
    [3_500n, 1_003_499n],
    [0n, 3_499n],
    [1_500n, 3_499n],
    [0n, 1_499n],
  ]);
});

it('throws when no fallback size can shrink the failed range', async () => {
  const error = new Error('RPC limit exceeded');
  getLogsMock.mockResolvedValueOnce([]).mockRejectedValueOnce(error);

  await expect(
    getLogsWithBatching(client, { ...params, fromBlock: 0n, toBlock: 1_000_499n }),
  ).rejects.toBe(error);
  expect(getLogsMock).toHaveBeenCalledTimes(2);
});

it('stops at the first nonempty batch when stopWhenFound is true', async () => {
  const event = mockCreateRollupEvent('0x01', 1_000_000n);
  getLogsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([event]);

  const logs = await getLogsWithBatching(
    client,
    { ...params, fromBlock: 0n, toBlock: latestBlock },
    { stopWhenFound: true },
  );

  expect(getLogsMock).toHaveBeenCalledTimes(2);
  expect(logs).toEqual([event]);
});

it('returns all events in the first matching batch when stopWhenFound is true', async () => {
  const events = [mockCreateRollupEvent('0x01', 10n), mockCreateRollupEvent('0x02', 20n)];
  getLogsMock.mockResolvedValueOnce(events);

  expect(
    await getLogsWithBatching(
      client,
      { ...params, fromBlock: 0n, toBlock: 999n },
      { stopWhenFound: true },
    ),
  ).toEqual(events);
  expect(getLogsMock).toHaveBeenCalledOnce();
});

it('uses an explicit batch size immediately, including a partial final batch', async () => {
  await getLogsWithBatching(
    client,
    { ...params, fromBlock: 100n, toBlock: 112n },
    { batchSize: 5n },
  );

  expect(getLogsMock.mock.calls.map(([range]) => [range?.fromBlock, range?.toBlock])).toEqual([
    [108n, 112n],
    [103n, 107n],
    [100n, 102n],
  ]);
});

it('propagates failures when an explicit batch size is provided', async () => {
  const error = new Error('RPC limit exceeded');
  getLogsMock.mockRejectedValueOnce(error);

  await expect(
    getLogsWithBatching(client, { ...params, fromBlock: 0n, toBlock: 100n }, { batchSize: 5n }),
  ).rejects.toBe(error);
  expect(getLogsMock).toHaveBeenCalledOnce();
});

it.each([0n, -1n])('rejects invalid batch size %s', async (batchSize) => {
  await expect(getLogsWithBatching(client, params, { batchSize })).rejects.toThrow(
    'batchSize must be greater than zero',
  );
  expect(getLogsMock).not.toHaveBeenCalled();
});
