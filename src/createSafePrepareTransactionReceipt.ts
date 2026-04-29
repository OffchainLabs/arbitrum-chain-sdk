import {
  TransactionReceipt,
  getAbiItem,
  getEventSelector,
  Log,
  decodeEventLog,
  Address,
} from 'viem';
import { SafeProxyFactoryAbi } from './createSafePrepareTransactionRequest';

function findProxyCreationEventLog(txReceipt: TransactionReceipt) {
  const abiItem = getAbiItem({ abi: SafeProxyFactoryAbi, name: 'ProxyCreation' });
  const eventSelector = getEventSelector(abiItem);
  const log = txReceipt.logs.find((log) => log.topics[0] === eventSelector);

  if (typeof log === 'undefined') {
    throw new Error(
      `No "ProxyCreation" logs found in logs for transaction: ${txReceipt.transactionHash}`,
    );
  }

  return log;
}

function decodeProxyCreationEventLog(log: Log<bigint, number>) {
  const decodedEventLog = decodeEventLog({ ...log, abi: SafeProxyFactoryAbi });

  if (decodedEventLog.eventName !== 'ProxyCreation') {
    throw new Error(`Expected "ProxyCreation" event but found: ${decodedEventLog.eventName}`);
  }

  return decodedEventLog;
}

export type CreateSafeTransactionReceipt = TransactionReceipt & {
  getSafeContract(): Address;
};

/**
 * Adds a getSafeContract() function to a regular {@link TransactionReceipt} for transactions that create a new Safe using the default SafeFactory
 */
export function createSafePrepareTransactionReceipt(
  txReceipt: TransactionReceipt,
): CreateSafeTransactionReceipt {
  return {
    ...txReceipt,
    getSafeContract: function () {
      const eventLog = findProxyCreationEventLog(txReceipt);
      const decodedEventLog = decodeProxyCreationEventLog(eventLog);
      const { proxy } = decodedEventLog.args;
      return proxy;
    },
  };
}
