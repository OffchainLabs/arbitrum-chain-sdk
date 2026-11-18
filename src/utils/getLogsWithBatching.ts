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
 * Try the full requested range first.
 * On failure, retry with smaller batches of 1M, 100k, 10k, then 2k blocks.
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
  if (batchSize !== undefined && batchSize <= 0n) {
    throw new RangeError('batchSize must be greater than zero');
  }
  const lowerLimit = fromBlock;
  const upperLimit = toBlock ?? (await publicClient.getBlockNumber());
  const { event, events, args, ...restGetLogsParameters } = getLogsParameters;
  let eventArgs = {};
  if (event) {
    eventArgs = { event, ...(args ? { args } : {}) };
  } else {
    eventArgs = { events };
  }
  const allEvents = [];
  const rangeSize = upperLimit - lowerLimit + 1n;
  const batchSizes =
    batchSize === undefined
      ? [rangeSize, ...[1_000_000n, 100_000n, 10_000n, 2_000n].filter((size) => size < rangeSize)]
      : [batchSize];
  let batchIndex = 0;

  // We're fetching from most recent block to oldest one
  let cursor = upperLimit;
  while (cursor >= lowerLimit) {
    const currentBatchSize = batchSizes[batchIndex];
    const rangeEnd = cursor;
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

    // Add the logs at the beginning to keep the order
    allEvents.unshift(logs);
    if (stopWhenFound && logs.length > 0) {
      return logs;
    }

    cursor = rangeStart - 1n;
  }

  return allEvents.flatMap((events) => events);
}
