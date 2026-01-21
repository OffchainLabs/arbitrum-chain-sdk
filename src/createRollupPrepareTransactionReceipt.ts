import {
  TransactionReceipt,
  getAbiItem,
  getEventSelector,
  Log,
  decodeEventLog,
  DecodeEventLogReturnType,
} from 'viem';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from './contracts/RollupCreator/v3.2';
import { rollupCreatorABI as rollupCreatorV3Dot1ABI } from './contracts/RollupCreator/v3.1';
import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from './contracts/RollupCreator/v2.1';

import { CoreContracts } from './types/CoreContracts';

function findRollupCreatedEventLog(txReceipt: TransactionReceipt): Log<bigint, number> {
  // v3.2
  const v3Dot2EventSelector = getEventSelector(
    getAbiItem({ abi: rollupCreatorV3Dot2ABI, name: 'RollupCreated' }),
  );
  // v3.1
  const v3Dot1EventSelector = getEventSelector(
    getAbiItem({ abi: rollupCreatorV3Dot1ABI, name: 'RollupCreated' }),
  );
  // v2.1 and v1.1 are the same, so we only need to handle v2.1
  const v2Dot1EventSelector = getEventSelector(
    getAbiItem({ abi: rollupCreatorV2Dot1ABI, name: 'RollupCreated' }),
  );

  const log = txReceipt.logs.find((log) => {
    const topic = log.topics[0];
    return (
      topic === v3Dot2EventSelector ||
      topic === v3Dot1EventSelector ||
      topic === v2Dot1EventSelector
    );
  });

  if (typeof log === 'undefined') {
    throw new Error(
      `No "RollupCreated" logs found in logs for transaction: ${txReceipt.transactionHash}`,
    );
  }

  return log;
}

type DecodeRollupCreatedEventLogReturnType = DecodeEventLogReturnType<
  // v3.2
  | typeof rollupCreatorV3Dot2ABI
  // v3.1
  | typeof rollupCreatorV3Dot1ABI
  // v2.1 and v1.1 are the same, so we only need to handle v2.1
  | typeof rollupCreatorV2Dot1ABI,
  'RollupCreated'
>;

function decodeRollupCreatedEventLog(
  log: Log<bigint, number>,
): DecodeRollupCreatedEventLogReturnType {
  let decodedEventLog: DecodeRollupCreatedEventLogReturnType | null = null;

  // try parsing from multiple RollupCreator versions
  [
    // v3.2
    rollupCreatorV3Dot2ABI,
    // v3.1
    rollupCreatorV3Dot1ABI,
    // v2.1 and v1.1 are the same, so we only need to handle v2.1
    rollupCreatorV2Dot1ABI,
  ].forEach((abi) => {
    try {
      const result = decodeEventLog({ ...log, abi });

      if (result.eventName === 'RollupCreated') {
        decodedEventLog = result;
      }
    } catch (error) {
      // do nothing
    }
  });

  if (decodedEventLog === null) {
    throw new Error(`Failed to decode "RollupCreated" event log: ${log}`);
  }

  return decodedEventLog;
}

export type CreateRollupTransactionReceipt = TransactionReceipt & {
  getCoreContracts(): CoreContracts;
};

export function createRollupPrepareTransactionReceipt(
  txReceipt: TransactionReceipt,
): CreateRollupTransactionReceipt {
  return {
    ...txReceipt,
    getCoreContracts: function () {
      const eventLog = findRollupCreatedEventLog(txReceipt);
      const decodedEventLog = decodeRollupCreatedEventLog(eventLog);

      const { rollupAddress, inboxAddress, ...rest } = decodedEventLog.args;

      return {
        rollup: rollupAddress,
        inbox: inboxAddress,
        ...rest,
        deployedAtBlockNumber: Number(txReceipt.blockNumber),
      };
    },
  };
}
