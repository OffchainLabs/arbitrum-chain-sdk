import { zeroAddress, zeroHash, parseEther } from 'viem';

import { getConsensusReleaseByVersion } from './wasmModuleRoot';
import { CreateRollupPrepareDeploymentParamsConfigResult as Config } from './createRollupPrepareDeploymentParamsConfig';
import { RollupCreatorSupportedVersion } from './types/createRollupTypes';

const defaultsV2Dot1 = {
  extraChallengeTimeBlocks: BigInt(0),
  stakeToken: zeroAddress,
  baseStake: parseEther(String(0.1)),
  wasmModuleRoot: getConsensusReleaseByVersion(51).wasmModuleRoot,
  loserStakeEscrow: zeroAddress,
  genesisBlockNum: BigInt(0),
} as const;

const bufferConfig: Config['bufferConfig'] = {
  threshold: BigInt(2 ** 32),
  max: BigInt(2 ** 32),
  replenishRateInBasis: BigInt(500),
};

const genesisAssertionState: Config['genesisAssertionState'] = {
  globalState: {
    bytes32Vals: [zeroHash, zeroHash],
    u64Vals: [BigInt(0), BigInt(0)],
  },
  machineStatus: 1,
  endHistoryRoot: zeroHash,
} as const;

const defaultsV3Dot1 = {
  anyTrustFastConfirmer: zeroAddress,
  bufferConfig,
  genesisAssertionState,
  genesisInboxCount: BigInt(0),
  layerZeroBlockEdgeHeight: BigInt(2 ** 26),
  layerZeroBigStepEdgeHeight: BigInt(2 ** 19),
  layerZeroSmallStepEdgeHeight: BigInt(2 ** 23),
  numBigStepLevel: 1,
  wasmModuleRoot: getConsensusReleaseByVersion(51).wasmModuleRoot,
} as const;

/**
 * Returns default values for the `config` parameter in `createRollup` for a given RollupCreator version.
 *
 * @param {RollupCreatorSupportedVersion} [rollupCreatorVersion='v3.1'] - The version of the RollupCreator contract
 * @returns {Object} Default configuration parameters specific to the RollupCreator version
 *
 * @example
 * // Get defaults for latest version (v3.1)
 * const defaults = createRollupPrepareDeploymentParamsConfigDefaults();
 *
 * @example
 * // Get defaults for specific version
 * const v2Defaults = createRollupPrepareDeploymentParamsConfigDefaults('v2.1');
 * const v3Defaults = createRollupPrepareDeploymentParamsConfigDefaults('v3.1');
 *
 * @see {@link https://docs.arbitrum.io/launch-orbit-chain/reference/additional-configuration-parameters}
 */
export function createRollupPrepareDeploymentParamsConfigDefaults(
  rollupCreatorVersion: 'v2.1',
): typeof defaultsV2Dot1;
export function createRollupPrepareDeploymentParamsConfigDefaults(
  rollupCreatorVersion: 'v3.1',
): typeof defaultsV3Dot1;
export function createRollupPrepareDeploymentParamsConfigDefaults(
  rollupCreatorVersion?: never,
): typeof defaultsV3Dot1;
export function createRollupPrepareDeploymentParamsConfigDefaults(
  rollupCreatorVersion: RollupCreatorSupportedVersion = 'v3.1',
) {
  if (rollupCreatorVersion === 'v2.1') {
    return defaultsV2Dot1;
  }

  return defaultsV3Dot1;
}
