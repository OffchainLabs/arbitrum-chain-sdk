import { Transaction, decodeFunctionData } from 'viem';
import { DecodeFunctionDataReturnType } from 'viem/_types/utils/abi/decodeFunctionData';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from './contracts/RollupCreator/v3.2';
import { rollupCreatorABI as rollupCreatorV3Dot1ABI } from './contracts/RollupCreator/v3.1';
import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from './contracts/RollupCreator/v2.1';
import { rollupCreatorABI as rollupCreatorV1Dot1ABI } from './contracts/RollupCreator/v1.1';

import {
  CreateRollupFunctionInputs,
  RollupCreatorABI,
  RollupCreatorVersion,
  RollupCreatorLatestVersion,
} from './types/createRollupTypes';

function createRollupDecodeFunctionData<TAbi extends RollupCreatorABI<RollupCreatorVersion>>(
  data: `0x${string}`,
): DecodeFunctionDataReturnType<TAbi> {
  let result: DecodeFunctionDataReturnType<TAbi> | null = null;

  // try parsing from multiple RollupCreator versions
  [
    // v3.2
    rollupCreatorV3Dot2ABI,
    // v3.1
    rollupCreatorV3Dot1ABI,
    // v2.1
    rollupCreatorV2Dot1ABI,
    // v1.1
    rollupCreatorV1Dot1ABI,
  ].forEach((abi) => {
    try {
      result = decodeFunctionData({ abi, data }) as DecodeFunctionDataReturnType<TAbi>;
    } catch (error) {
      // do nothing
    }
  });

  if (result === null) {
    throw new Error(`[createRollupPrepareTransaction] failed to decode function data`);
  }

  return result;
}

export type CreateRollupTransaction = Transaction & {
  getInputs<
    TVersion extends RollupCreatorVersion = RollupCreatorLatestVersion,
  >(): CreateRollupFunctionInputs<TVersion>;
};

export function createRollupPrepareTransaction(tx: Transaction): CreateRollupTransaction {
  return {
    ...tx,
    getInputs: function () {
      const { functionName, args } = createRollupDecodeFunctionData(tx.input);

      if (functionName !== 'createRollup') {
        throw new Error(`
          [createRollupPrepareTransaction] expected function name to be "createRollup" but got "${functionName}"
        `);
      }

      if (typeof args === 'undefined') {
        throw new Error(`[createRollupPrepareTransaction] failed to decode function data`);
      }

      return args;
    },
  };
}
