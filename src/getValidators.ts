import { z } from 'zod';
import {
  Address,
  Chain,
  Hex,
  PublicClient,
  Transport,
  decodeFunctionData,
  getAbiItem,
  getFunctionSelector,
} from 'viem';
import { addressSchema } from './schemas/primitives';

import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from './contracts/RollupCreator/v2.1';
import { rollupCreatorABI as rollupCreatorV1Dot1ABI } from './contracts/RollupCreator/v1.1';
import { upgradeExecutorABI } from './contracts/UpgradeExecutor';
import { gnosisSafeL2ABI } from './contracts/GnosisSafeL2';
import { rollupABI as rollupV3Dot1ABI } from './contracts/Rollup';
import { rollupABI as rollupV2Dot1ABI } from './contracts/Rollup/v2.1';

import { createRollupFetchTransactionHash } from './createRollupFetchTransactionHash';
import { getLogsWithBatching } from './utils/getLogsWithBatching';

const createRollupV2Dot1ABI = getAbiItem({ abi: rollupCreatorV2Dot1ABI, name: 'createRollup' });
const createRollupV2Dot1FunctionSelector = getFunctionSelector(createRollupV2Dot1ABI);

const createRollupV1Dot1ABI = getAbiItem({ abi: rollupCreatorV1Dot1ABI, name: 'createRollup' });
const createRollupV1Dot1FunctionSelector = getFunctionSelector(createRollupV1Dot1ABI);

const setValidatorABI = getAbiItem({ abi: rollupV3Dot1ABI, name: 'setValidator' });
const setValidatorFunctionSelector = getFunctionSelector(setValidatorABI);

const executeCallABI = getAbiItem({ abi: upgradeExecutorABI, name: 'executeCall' });
const upgradeExecutorExecuteCallFunctionSelector = getFunctionSelector(executeCallABI);

const execTransactionABI = getAbiItem({ abi: gnosisSafeL2ABI, name: 'execTransaction' });
const safeL2FunctionSelector = getFunctionSelector(execTransactionABI);

const ownerFunctionCalledEventAbi = getAbiItem({
  abi: rollupV2Dot1ABI,
  name: 'OwnerFunctionCalled',
});

const validatorsSetEventAbi = getAbiItem({ abi: rollupV3Dot1ABI, name: 'ValidatorsSet' });

function getValidatorsFromFunctionData<
  TAbi extends
    | (typeof createRollupV2Dot1ABI)[]
    | (typeof createRollupV1Dot1ABI)[]
    | (typeof setValidatorABI)[],
>({ abi, data }: { abi: TAbi; data: Hex }) {
  const { args } = decodeFunctionData({
    abi,
    data,
  });
  return args;
}

function iterateThroughValidatorsList(
  acc: Set<Address>,
  validators: Readonly<Address[]> | undefined,
  enabled: Readonly<boolean[]> | undefined,
) {
  if (typeof validators === 'undefined' || typeof enabled === 'undefined') {
    return acc;
  }

  const copy = new Set<Address>(acc);

  validators.forEach((validator, i) => {
    const isAdd = enabled[i];
    if (isAdd) {
      copy.add(validator);
    } else {
      copy.delete(validator);
    }
  });

  return copy;
}

function updateAccumulator(acc: Set<Address>, input: Hex) {
  const [validators, enabled] = getValidatorsFromFunctionData({
    abi: [setValidatorABI],
    data: input,
  });

  return iterateThroughValidatorsList(acc, validators, enabled);
}

export type GetValidatorsParams = {
  /** Address of the rollup we're getting list of validators from */
  rollup: Address;
};
export type GetValidatorsReturnType = {
  /**
   * If logs contain unknown signature, validators list might:
   * - contain false positives (validators that were removed, but returned as validator)
   * - contain false negatives (validators that were added, but not present in the list)
   */
  isAccurate: boolean;
  /** List of validators for the given rollup */
  validators: Address[];
};

async function getValidatorsPreV3Dot1<TChain extends Chain>(
  publicClient: PublicClient<Transport, TChain>,
  { rollup }: GetValidatorsParams,
  blockNumber: bigint,
): Promise<GetValidatorsReturnType> {
  const preV3Dot1Events = await getLogsWithBatching(publicClient, {
    address: rollup,
    event: ownerFunctionCalledEventAbi,
    args: { id: 6n },
    fromBlock: blockNumber,
  });

  /** For pre v3.1, the OwnerFunctionCalled event is emitted when the validators list is updated
   * the event is emitted without the validators list and the new states in the event args
   * so we have to grab the tx and decode the calldata to get the validators list
   */
  const preV3Dot1Txs = await Promise.all(
    preV3Dot1Events.map((event) =>
      publicClient.getTransaction({
        hash: event.transactionHash,
      }),
    ),
  );

  let isAccurate = true;
  const validators = preV3Dot1Txs.reduce((acc, tx) => {
    const txSelectedFunction = tx.input.slice(0, 10);

    switch (txSelectedFunction) {
      case createRollupV2Dot1FunctionSelector: {
        const [{ validators }] = getValidatorsFromFunctionData({
          abi: [createRollupV2Dot1ABI],
          data: tx.input,
        });

        return new Set([...acc, ...validators]);
      }
      case createRollupV1Dot1FunctionSelector: {
        const [{ validators }] = getValidatorsFromFunctionData({
          abi: [createRollupV1Dot1ABI],
          data: tx.input,
        });

        return new Set([...acc, ...validators]);
      }
      case setValidatorFunctionSelector: {
        return updateAccumulator(acc, tx.input);
      }
      case upgradeExecutorExecuteCallFunctionSelector: {
        const { args: executeCallCalldata } = decodeFunctionData({
          abi: [executeCallABI],
          data: tx.input,
        });
        return updateAccumulator(acc, executeCallCalldata[1]);
      }
      case safeL2FunctionSelector: {
        const { args: execTransactionCalldata } = decodeFunctionData({
          abi: [execTransactionABI],
          data: tx.input,
        });

        const execTransactionCalldataData = execTransactionCalldata[2];
        const execTransactionCalldataDataFnSelector = execTransactionCalldataData.slice(0, 10);

        if (execTransactionCalldataDataFnSelector !== upgradeExecutorExecuteCallFunctionSelector) {
          console.warn(
            `[getValidators] unable to decode "execTransaction" calldata, tx id: ${tx.hash}`,
          );
          isAccurate = false;
          return acc;
        }

        const { args: executeCallCalldata } = decodeFunctionData({
          abi: [executeCallABI],
          data: execTransactionCalldataData,
        });

        return updateAccumulator(acc, executeCallCalldata[1]);
      }
      default: {
        console.warn(`[getValidators] unknown 4bytes, tx id: ${tx.hash}`);
        isAccurate = false;
        return acc;
      }
    }
  }, new Set<Address>());

  return {
    isAccurate,
    validators: [...validators],
  };
}

/**
 *
 * @param {PublicClient} publicClient - The chain Viem Public Client
 * @param {GetValidatorsParams} GetValidatorsParams {@link GetValidatorsParams}
 *
 * @returns Promise<{@link GetValidatorsReturnType}>
 *
 * @remarks validators list is not guaranteed to be exhaustive if the `isAccurate` flag is false.
 * It might contain false positive (validators that were removed, but returned as validator)
 * or false negative (validators that were added, but not present in the list)
 *
 * @example
 * const { isAccurate, validators } = getValidators(client, { rollup: '0xc47dacfbaa80bd9d8112f4e8069482c2a3221336' });
 *
 * if (isAccurate) {
 *   // Validators were all fetched properly
 * } else {
 *   // Validators list is not guaranteed to be accurate
 * }
 */
export const getValidatorsParams = z.object({ rollup: addressSchema });

export async function getValidators<TChain extends Chain>(
  publicClient: PublicClient<Transport, TChain>,
  { rollup }: GetValidatorsParams,
): Promise<GetValidatorsReturnType> {
  getValidatorsParams.parse({ rollup });
  let blockNumber: bigint;
  try {
    const createRollupTransactionHash = await createRollupFetchTransactionHash({
      rollup,
      publicClient,
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: createRollupTransactionHash,
    });
    blockNumber = receipt.blockNumber;
  } catch {
    blockNumber = 0n;
  }

  const validatorsSetEvents = await getLogsWithBatching(publicClient, {
    address: rollup,
    event: validatorsSetEventAbi,
    fromBlock: blockNumber,
  });

  const validatorsFromEvents = validatorsSetEvents
    .filter((event) => event.eventName === 'ValidatorsSet')
    .reduce((acc, event) => {
      const { validators: _validators, enabled: _enabled } = event.args;
      return iterateThroughValidatorsList(acc, _validators, _enabled);
    }, new Set<Address>());

  if (validatorsFromEvents.size > 0) {
    return {
      isAccurate: true,
      validators: [...validatorsFromEvents],
    };
  }

  return getValidatorsPreV3Dot1(publicClient, { rollup }, blockNumber);
}
