import {
  Address,
  PublicClient,
  Transport,
  Chain,
  TransactionReceipt,
  getAbiItem,
  getEventSelector,
  Log,
  Hex,
} from 'viem';
import { AbiEvent } from 'abitype';

import { getLogsWithBatching } from './utils/getLogsWithBatching';
import { getEarliestRollupCreatorDeploymentBlockNumber } from './utils/getEarliestRollupCreatorDeploymentBlockNumber';
import { rollupABI as rollupV3Dot1ABI } from './contracts/Rollup';
import { rollupABI as rollupV2Dot1ABI } from './contracts/Rollup/v2.1';

export type CreateRollupFetchTransactionHashParams<TChain extends Chain | undefined> = {
  rollup: Address;
  publicClient: PublicClient<Transport, TChain>;
  fromBlock?: bigint;
};

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

// it's the same between v2.1 and v3.1
const pausedEventSelector = getEventSelector(
  getAbiItem({
    abi: rollupV3Dot1ABI,
    name: 'Paused',
  }),
);
const userStakeUpdatedEventSelectorV3Dot1 = getEventSelector(
  getAbiItem({
    abi: rollupV3Dot1ABI,
    name: 'UserStakeUpdated',
  }),
);
const userStakeUpdatedEventSelectorV2Dot1 = getEventSelector(
  getAbiItem({
    abi: rollupV2Dot1ABI,
    name: 'UserStakeUpdated',
  }),
);

function getNextRollupQuery(txReceipt: TransactionReceipt): Address | undefined {
  let pausedEventLog: Log<bigint, number, false> | undefined;
  let userStakeUpdatedEventLog: Log<bigint, number, false> | undefined;

  txReceipt.logs.forEach((log) => {
    const topic = log.topics[0];

    if (topic === pausedEventSelector) {
      pausedEventLog = log;
    }

    if (
      topic === userStakeUpdatedEventSelectorV3Dot1 ||
      topic === userStakeUpdatedEventSelectorV2Dot1
    ) {
      userStakeUpdatedEventLog = log;
    }
  });

  // both events are there, so it's likely an upgrade
  if (typeof pausedEventLog !== 'undefined' && typeof userStakeUpdatedEventLog !== 'undefined') {
    return pausedEventLog.address;
  }

  return undefined;
}

export async function getRollupInitializedEvents<TChain extends Chain | undefined>({
  rollup,
  publicClient,
  fromBlock,
}: CreateRollupFetchTransactionHashParams<TChain>) {
  // Find the RollupInitialized event from that Rollup contract
  const rollupInitializedEvents = await getLogsWithBatching(publicClient, {
    address: rollup,
    event: RollupInitializedEventAbi,
    fromBlock: fromBlock ?? getEarliestRollupCreatorDeploymentBlockNumber(publicClient),
  });

  if (rollupInitializedEvents.length !== 1) {
    throw new Error(
      `Expected to find 1 RollupInitialized event for rollup address ${rollup} but found ${rollupInitializedEvents.length}`,
    );
  }

  return rollupInitializedEvents;
}

export async function createRollupFetchTransactionHash<TChain extends Chain | undefined>({
  rollup,
  publicClient,
  fromBlock,
}: CreateRollupFetchTransactionHashParams<TChain>) {
  let rollupQuery: Address | undefined = rollup;
  let transactionHash: Hex | undefined = undefined;

  while (rollupQuery) {
    // get the transaction hash and receipt for transaction that emitted the RollupInitialized event
    transactionHash = (
      await getRollupInitializedEvents({ rollup: rollupQuery, publicClient, fromBlock })
    )[0].transactionHash;
    const transactionReceipt = await publicClient.getTransactionReceipt({
      hash: transactionHash,
    });

    // we'll check the transaction receipt to see if it looks like a Rollup upgrade transaction, and return the next address to query
    // we'll keep following the chain of upgrades until we find the original deployment
    rollupQuery = getNextRollupQuery(transactionReceipt);
  }

  if (!transactionHash) {
    throw new Error(
      `No transactionHash found in RollupInitialized event for rollup address ${rollup}`,
    );
  }

  return transactionHash;
}
