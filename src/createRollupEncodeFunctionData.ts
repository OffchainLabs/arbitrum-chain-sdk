import { encodeFunctionData, Hex } from 'viem';

import { rollupCreatorABI as rollupCreatorV3Dot2ABI } from './contracts/RollupCreator/v3.2';
import { rollupCreatorABI as rollupCreatorV2Dot1ABI } from './contracts/RollupCreator/v2.1';

import {
  CreateRollupFunctionInputs,
  RollupCreatorSupportedVersion,
} from './types/createRollupTypes';

/**
 * Encodes function data for the `createRollup` function call based on the RollupCreator version using the appropriate ABI.
 *
 * @param args - Function arguments matching the specified version
 * @param rollupCreatorVersion - Rollup creator version (defaults to v3.2)
 * @returns The encoded function data as a hex string
 *
 * @example
 * // Encode for default version (v3.2)
 * const encodedData = createRollupEncodeFunctionData(args);
 *
 * @example
 * // Encode for specific version
 * const encodedDataV2 = createRollupEncodeFunctionData(args, 'v2.1');
 * const encodedDataV3 = createRollupEncodeFunctionData(args, 'v3.2');
 */
export function createRollupEncodeFunctionData<
  TRollupCreatorVersion extends RollupCreatorSupportedVersion = 'v3.2',
>(
  args: CreateRollupFunctionInputs<TRollupCreatorVersion>,
  rollupCreatorVersion: TRollupCreatorVersion = 'v3.2' as TRollupCreatorVersion,
): Hex {
  if (rollupCreatorVersion === 'v2.1') {
    return encodeFunctionData({
      abi: rollupCreatorV2Dot1ABI,
      functionName: 'createRollup',
      args: args as CreateRollupFunctionInputs<'v2.1'>,
    });
  }

  return encodeFunctionData({
    abi: rollupCreatorV3Dot2ABI,
    functionName: 'createRollup',
    args: args as CreateRollupFunctionInputs<'v3.2'>,
  });
}
