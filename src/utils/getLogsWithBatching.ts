import { Chain, GetLogsParameters, GetLogsReturnType, PublicClient, Transport } from 'viem';
import { AbiEvent } from 'abitype';

import { validateParentChain } from '../types/ParentChain';
import { getEarliestRollupCreatorDeploymentBlockNumber } from './getEarliestRollupCreatorDeploymentBlockNumber';

type Options = {
  /** When batching calls, stop on the first event found */
  stopWhenFound?: boolean;
  /** Size of the batch when batching calls */
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
 * Fetch logs for a given range. On failure, we batch logs to avoid rate limiting.
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
  { stopWhenFound = false, batchSize = 9_999n }: Options = {
    stopWhenFound: false,
    batchSize: 9_999n,
  },
) {
  let lowerLimit = fromBlock;
  const latestBlockNumber = await publicClient.getBlockNumber();
  validateParentChain(publicClient);
  if (!fromBlock) {
    lowerLimit = getEarliestRollupCreatorDeploymentBlockNumber(publicClient);
  }
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
    console.warn(`[getLogsWithBatching] Now batching requests: ${(e as Error).message}`);
    const allEvents = [];

    // Fetch logs `batchSize` blocks at a time to avoid rate limiting
    // We're fetching from most recent block to oldest one
    let cursor = toBlock ?? latestBlockNumber;
    while (cursor >= lowerLimit) {
      const rangeEnd = cursor;
      // If we want to fetch X blocks from 0 (0 and X included), we need to fetch blocks from 0 to X-1
      const rangeStart =
        cursor - batchSize + 1n > lowerLimit ? cursor - batchSize + 1n : lowerLimit;
      const logs = await publicClient.getLogs({
        ...eventArgs,
        ...restGetLogsParameters,
        fromBlock: rangeStart,
        toBlock: rangeEnd,
      });

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
