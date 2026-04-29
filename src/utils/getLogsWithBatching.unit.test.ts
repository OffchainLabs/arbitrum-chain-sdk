import { createPublicClient, http } from 'viem';
import { AbiEvent } from 'abitype';
import { arbitrumSepolia } from 'viem/chains';
import { it, expect, vi, describe } from 'vitest';

import { getLogsWithBatching } from './getLogsWithBatching';

function mockCreateRollupEvent(transactionHash: string, blockNumber: bigint) {
  return {
    address: '0x193e2887031c148ab54f5e856ea51ae521661200',
    args: { id: 6n },
    blockHash: '0x3bafb9574d8a3a7c09070935dc3ca936a5df06e2abd09cbd2a3cd489562e748f',
    blockNumber,
    data: '0x',
    eventName: 'OwnerFunctionCalled',
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

it(`getLogsWithBatching doesn't default to batching if first call is successful`, async () => {
  const client = createPublicClient({
    transport: http(),
    chain: arbitrumSepolia,
  });
  const blockNumber = await client.getBlockNumber();
  const getLogsMock = vi.fn();
  client.getLogs = getLogsMock;
  const createRollupEvent = mockCreateRollupEvent(
    '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
    blockNumber - 25_000n, // Included in the 3rd block from the last
  );
  getLogsMock.mockResolvedValueOnce([createRollupEvent]);

  const rollupInitializedEvents = await getLogsWithBatching(client, {
    address: rollupAddress,
    event: RollupInitializedEventAbi,
    fromBlock: blockNumber - 35_000n,
    toBlock: blockNumber,
  });

  expect(getLogsMock.mock.calls).toHaveLength(1);
  // First call is trying to fetch the entire interval
  expect(getLogsMock.mock.calls[0][0]).toMatchObject({
    fromBlock: blockNumber - 35_000n,
    toBlock: blockNumber,
  });
  expect(rollupInitializedEvents).toEqual([createRollupEvent]);
});

it('getLogsWithBatching default to batching if first call is failing', async () => {
  const client = createPublicClient({
    transport: http(),
    chain: arbitrumSepolia,
  });
  const blockNumber = await client.getBlockNumber();
  const getLogsMock = vi.fn();
  client.getLogs = getLogsMock;
  const createRollupEvent = mockCreateRollupEvent(
    '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
    blockNumber - 25_000n, // Included in the 3rd block from the last
  );
  getLogsMock
    // First call, we simulate a RPC failure, and default to batching
    .mockRejectedValueOnce(new Error('[mock] RPC limits exceeded'))
    // First 2 calls from current block don't return any event
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    // Last call return event
    .mockResolvedValueOnce([createRollupEvent])
    .mockResolvedValue([]);

  const rollupInitializedEvents = await getLogsWithBatching(client, {
    address: rollupAddress,
    event: RollupInitializedEventAbi,
    fromBlock: blockNumber - 35_000n,
    toBlock: blockNumber,
  });

  // First call covering the entire range + 4 for the batched calls
  expect(getLogsMock.mock.calls).toHaveLength(5);

  // First call is trying to fetch the entire interval
  expect(getLogsMock.mock.calls[0][0]).toMatchObject({
    fromBlock: blockNumber - 35_000n,
    toBlock: blockNumber,
  });

  // Next calls fetch the entire batch size
  for (let i = 1; i < 4; i++) {
    expect(getLogsMock.mock.calls[i][0]).toMatchObject({
      fromBlock: blockNumber - BigInt(i) * 9_999n + 1n,
      toBlock: blockNumber - BigInt(i - 1) * 9_999n,
    });
  }

  // Last call fetch a small number of blocks than the batch size, because we have fromBlock set
  expect(getLogsMock.mock.calls[4][0]).toMatchObject({
    fromBlock: blockNumber - 35_000n,
    toBlock: blockNumber - 3n * 9_999n,
  });
  expect(rollupInitializedEvents).toEqual([createRollupEvent]);
});

describe('when stopWhenFound option is set to true', () => {
  it('getLogsWithBatching should return all events if first call is successful', async () => {
    const client = createPublicClient({
      transport: http(),
      chain: arbitrumSepolia,
    });
    const blockNumber = await client.getBlockNumber();
    const getLogsMock = vi.fn();
    client.getLogs = getLogsMock;
    const oldCreateRollupEvent = mockCreateRollupEvent(
      '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
      blockNumber - 25_000n, // Included in the 3rd block from the last
    );
    const recentCreateRollupEvent = mockCreateRollupEvent(
      '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10',
      blockNumber - 15_000n, // Included in the 2nd block from the last
    );
    getLogsMock.mockResolvedValueOnce([oldCreateRollupEvent, recentCreateRollupEvent]);

    const rollupInitializedEvents = await getLogsWithBatching(
      client,
      {
        address: rollupAddress,
        event: RollupInitializedEventAbi,
        fromBlock: blockNumber - 35_000n,
        toBlock: blockNumber,
      },
      {
        stopWhenFound: true,
      },
    );

    expect(getLogsMock.mock.calls).toHaveLength(1);
    // First call is trying to fetch the entire interval
    expect(getLogsMock.mock.calls[0][0]).toMatchObject({
      fromBlock: blockNumber - 35_000n,
      toBlock: blockNumber,
    });
    expect(rollupInitializedEvents).toEqual([oldCreateRollupEvent, recentCreateRollupEvent]);
  });

  it('getLogsWithBatching should stop at the most recent even found if first call is failing', async () => {
    const client = createPublicClient({
      transport: http(),
      chain: arbitrumSepolia,
    });
    const blockNumber = await client.getBlockNumber();
    const getLogsMock = vi.fn();
    client.getLogs = getLogsMock;
    const oldCreateRollupEvent = mockCreateRollupEvent(
      '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
      blockNumber - 25_000n, // Included in the 3rd block from the last
    );
    const recentCreateRollupEvent = mockCreateRollupEvent(
      '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10',
      blockNumber - 15_000n, // Included in the 2nd block from the last
    );
    getLogsMock
      // First call, we simulate a RPC failure, and default to batching
      .mockRejectedValueOnce(new Error('[mock] RPC limits exceeded'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([recentCreateRollupEvent])
      .mockResolvedValueOnce([oldCreateRollupEvent])
      .mockResolvedValue([]);

    const rollupInitializedEvents = await getLogsWithBatching(
      client,
      {
        address: rollupAddress,
        event: RollupInitializedEventAbi,
        fromBlock: blockNumber - 35_000n,
        toBlock: blockNumber,
      },
      {
        stopWhenFound: true,
      },
    );

    // First call covering the entire range + 2 calls (until we find the event)
    expect(getLogsMock.mock.calls).toHaveLength(3);

    // First call is trying to fetch the entire interval
    expect(getLogsMock.mock.calls[0][0]).toMatchObject({
      fromBlock: blockNumber - 35_000n,
      toBlock: blockNumber,
    });

    // Next calls fetch the entire batch size
    for (let i = 1; i < 3; i++) {
      expect(getLogsMock.mock.calls[i][0]).toMatchObject({
        fromBlock: blockNumber - BigInt(i) * 9_999n + 1n,
        toBlock: blockNumber - BigInt(i - 1) * 9_999n,
      });
    }

    expect(rollupInitializedEvents).toEqual([recentCreateRollupEvent]);
  });
});

describe('when batch size is set', () => {
  it('getLogsWithBatching should fetch the entire interval if first call is successful', async () => {
    const client = createPublicClient({
      transport: http(),
      chain: arbitrumSepolia,
    });
    const blockNumber = await client.getBlockNumber();
    const getLogsMock = vi.fn();
    client.getLogs = getLogsMock;
    const oldCreateRollupEvent = mockCreateRollupEvent(
      '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
      blockNumber - 25_000n, // Included in the 3rd block from the last
    );
    const recentCreateRollupEvent = mockCreateRollupEvent(
      '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10',
      blockNumber - 15_000n, // Included in the 2nd block from the last
    );
    getLogsMock.mockResolvedValueOnce([oldCreateRollupEvent, recentCreateRollupEvent]);

    const rollupInitializedEvents = await getLogsWithBatching(
      client,
      {
        address: rollupAddress,
        event: RollupInitializedEventAbi,
        fromBlock: blockNumber - 35_000n,
        toBlock: blockNumber,
      },
      {
        batchSize: 1n,
      },
    );

    expect(getLogsMock.mock.calls).toHaveLength(1);
    // First call is trying to fetch the entire interval
    expect(getLogsMock.mock.calls[0][0]).toMatchObject({
      fromBlock: blockNumber - 35_000n,
      toBlock: blockNumber,
    });
    expect(rollupInitializedEvents).toEqual([oldCreateRollupEvent, recentCreateRollupEvent]);
  });

  it('getLogsWithBatching should fetch the interval by batchSize increment if first call is failing', async () => {
    const client = createPublicClient({
      transport: http(),
      chain: arbitrumSepolia,
    });
    const blockNumber = await client.getBlockNumber();
    const getLogsMock = vi.fn();
    client.getLogs = getLogsMock;
    const createRollupEvent = mockCreateRollupEvent(
      '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
      blockNumber - 25_052n, // Included in the 2nd block from the last
    );
    getLogsMock
      // First call, we simulate a RPC failure, and default to batching
      .mockRejectedValueOnce(new Error('[mock] RPC limits exceeded'))
      // First 4 calls from current block don't return any event
      .mockResolvedValueOnce([]) // current block to - 5 000
      .mockResolvedValueOnce([]) // -5 000 to -10 000
      .mockResolvedValueOnce([]) // -10 000 to -15 000
      .mockResolvedValueOnce([]) // - 15 000 to -20 000
      // Last call return event
      .mockResolvedValueOnce([createRollupEvent]); // -25 000 to -30 000

    const rollupInitializedEvents = await getLogsWithBatching(
      client,
      {
        address: rollupAddress,
        event: RollupInitializedEventAbi,
        fromBlock: blockNumber - 37_000n,
        toBlock: blockNumber,
      },
      {
        batchSize: 5_000n,
      },
    );

    // First call covering the entire range + 8 for the batched calls
    expect(getLogsMock.mock.calls).toHaveLength(9);

    // First call is trying to fetch the entire interval
    expect(getLogsMock.mock.calls[0][0]).toMatchObject({
      fromBlock: blockNumber - 37_000n,
      toBlock: blockNumber,
    });

    // Next calls fetch the range 5_000 by 5_000 block
    for (let i = 1; i < 8; i++) {
      expect(getLogsMock.mock.calls[i][0]).toMatchObject({
        fromBlock: blockNumber - BigInt(i) * 5_000n + 1n,
        toBlock: blockNumber - BigInt(i - 1) * 5_000n,
      });
    }

    // Last call fetch a small number of blocks than the batch size, because we have fromBlock set
    expect(getLogsMock.mock.calls[8][0]).toMatchObject({
      fromBlock: blockNumber - 37_000n,
      toBlock: blockNumber - 7n * 5_000n,
    });
    expect(rollupInitializedEvents).toEqual([createRollupEvent]);
  });
});
