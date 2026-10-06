import { Chain, GetLogsParameters, GetLogsReturnType, PublicClient, Transport } from 'viem';
import { AbiEvent } from 'abitype';

type Options = {
  /** When batching calls, stop on the first event found */
  stopWhenFound?: boolean;
  /** Use a fixed batch size instead of the default fallback sizes. */
  batchSize?: bigint;
};
type GetLogsOptions = {
  fromBlock?: bigint;
  toBlock?: bigint;
};

/**
 *
 * @param {PublicClient} publicClient - The chain Viem Public Client
 * @param {GetLogsParameters} getLogsParameters {@link GetLogsParameters}
 * @param {Options} options {@link Options}
 *
 * @returns Promise<{@link GetLogsReturnType}>
 *
 * Fetch the full range first. On failure, try 1M, 100k, then 10k block batches,
 * skipping sizes that are at least as large as the requested range.
 * Starts at block zero when fromBlock is omitted, regardless of the client's chain.
 *
 * @example
 * const events = await getLogsWithBatching(client, {
 *   address: rollupAddress,
 *   event: RollupInitializedEventAbi,
 *   fromBlock: 0n,
 *   toBlock: blockNumber,
 * });
 */
export async function getLogsWithBatching<
  TAbiEvent extends AbiEvent,
  TChain extends Chain | undefined,
>(
  publicClient: PublicClient<Transport, TChain>,
  params: Omit<GetLogsParameters<TAbiEvent>, 'blockHash'> & GetLogsOptions,
  options?: Options,
): Promise<GetLogsReturnType<TAbiEvent>>;
export async function getLogsWithBatching<
  TAbiEvent extends AbiEvent,
  TChain extends Chain | undefined,
>(
  publicClient: PublicClient<Transport, TChain>,
  params: Omit<GetLogsParameters<undefined, TAbiEvent[]>, 'blockHash'> & GetLogsOptions,
  options?: Options,
): Promise<GetLogsReturnType<undefined, TAbiEvent[]>>;
export async function getLogsWithBatching<
  TAbiEvent extends AbiEvent,
  TChain extends Chain | undefined,
>(
  publicClient: PublicClient<Transport, TChain>,
  {
    fromBlock = 0n,
    toBlock,
    ...getLogsParameters
  }: Omit<GetLogsParameters<TAbiEvent, TAbiEvent[]>, 'blockHash'> & GetLogsOptions,
  { stopWhenFound = false, batchSize }: Options = {},
) {
  const lowerLimit = fromBlock;
  const latestBlockNumber = await publicClient.getBlockNumber();
  const { event, events, args, ...restGetLogsParameters } = getLogsParameters;
  let eventArgs = {};
  if (event) {
    eventArgs = { event, ...(args ? { args } : {}) };
  } else {
    eventArgs = { events };
  }
  try {
    return await publicClient.getLogs({
      ...eventArgs,
      ...restGetLogsParameters,
      fromBlock,
      toBlock: toBlock ?? latestBlockNumber,
    });
  } catch (e) {
    const allEvents = [];
    const upperLimit = toBlock ?? latestBlockNumber;
    const batchSizes =
      batchSize === undefined
        ? [1_000_000n, 100_000n, 10_000n].filter((size) => size < upperLimit - lowerLimit + 1n)
        : [batchSize];
    if (batchSizes.length === 0) {
      throw e;
    }
    let batchIndex = 0;
    console.warn(
      `[getLogsWithBatching] Falling back to ${batchSizes[batchIndex]} block batches: ${
        (e as Error).message
      }`,
    );

    // We're fetching from most recent block to oldest one
    let cursor = upperLimit;
    while (cursor >= lowerLimit) {
      const currentBatchSize = batchSizes[batchIndex];
      const rangeEnd = cursor;
      // If we want to fetch X blocks from 0 (0 and X included), we need to fetch blocks from 0 to X-1
      const rangeStart =
        cursor - currentBatchSize + 1n > lowerLimit ? cursor - currentBatchSize + 1n : lowerLimit;
      let logs;
      try {
        logs = await publicClient.getLogs({
          ...eventArgs,
          ...restGetLogsParameters,
          fromBlock: rangeStart,
          toBlock: rangeEnd,
        });
      } catch (error) {
        batchIndex += 1;
        // Retry the same cursor with a smaller range, preserving already collected events.
        while (
          batchIndex < batchSizes.length &&
          batchSizes[batchIndex] >= rangeEnd - rangeStart + 1n
        ) {
          batchIndex += 1;
        }
        if (batchIndex === batchSizes.length) {
          throw error;
        }
        console.warn(
          `[getLogsWithBatching] Falling back to ${batchSizes[batchIndex]} block batches: ${
            (error as Error).message
          }`,
        );
        continue;
      }

      if (logs) {
        // Add the logs at the beginning to keep the order
        allEvents.unshift(logs);
      }
      if (stopWhenFound && logs.length > 0) {
        return logs;
      }

      cursor = rangeStart - 1n;
    }

    return allEvents.flatMap((events) => events);
  }
}
