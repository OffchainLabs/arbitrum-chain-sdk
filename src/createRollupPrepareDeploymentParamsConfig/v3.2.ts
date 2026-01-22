import { Chain, Client, Transport, parseEther } from 'viem';

import { ChainConfig } from '../types/ChainConfig';
import { validateParentChain } from '../types/ParentChain';
import { Prettify } from '../types/utils';
import { getWethAddress } from '../utils';
import { prepareChainConfigSortKeys } from '../prepareChainConfigSortKeys';

import { createRollup } from '../createRollup';
import { CreateRollupFunctionInputs } from '../types/createRollupTypes';
import { prepareChainConfig } from '../prepareChainConfig';

import { createRollupPrepareDeploymentParamsConfigDefaults } from '../createRollupPrepareDeploymentParamsConfigDefaults';
import { getDefaultConfirmPeriodBlocks } from '../getDefaultConfirmPeriodBlocks';
import { getDefaultChallengeGracePeriodBlocks } from '../getDefaultChallengeGracePeriodBlocks';
import { getDefaultMinimumAssertionPeriod } from '../getDefaultMinimumAssertionPeriod';
import { getDefaultValidatorAfkBlocks } from '../getDefaultValidatorAfkBlocks';
import {
  SequencerInboxMaxTimeVariation,
  getDefaultSequencerInboxMaxTimeVariation,
} from '../getDefaultSequencerInboxMaxTimeVariation';

export type CreateRollupPrepareDeploymentParamsConfigResult =
  CreateRollupFunctionInputs[0]['config'];

type RequiredKeys = 'chainId' | 'owner';
type RequiredParams = Pick<CreateRollupPrepareDeploymentParamsConfigResult, RequiredKeys>;
type OptionalParams = Partial<
  Omit<CreateRollupPrepareDeploymentParamsConfigResult, 'chainConfig' | RequiredKeys>
>;

export type CreateRollupPrepareDeploymentParamsConfigParams = Prettify<
  RequiredParams & { chainConfig?: ChainConfig } & OptionalParams
>;

/**
 * Creates the configuration object to be used with {@link createRollup}.
 *
 * @param {PublicClient} client Parent chain client
 * @param {Object} params Chain configuration parameters
 * @see https://docs.arbitrum.io/launch-orbit-chain/how-tos/customize-deployment-configuration
 * @see https://docs.arbitrum.io/launch-orbit-chain/reference/additional-configuration-parameters
 * @param {string} params.owner
 * @param {BigInt} params.chainId
 * @param {ChainConfig} [params.chainConfig]
 * @param {BigInt} [params.confirmPeriodBlocks]
 * @param {BigInt} [params.extraChallengeTimeBlocks]
 * @param {string} [params.stakeToken]
 * @param {BigInt} [params.baseStake]
 * @param {string} [params.wasmModuleRoot]
 * @param {string} [params.loserStakeEscrow]
 * @param {BigInt} [params.genesisBlockNum]
 * @param {BigInt} [params.dataCostEstimate]
 * @param {Object} [params.sequencerInboxMaxTimeVariation]
 * @param {BigInt} [params.sequencerInboxMaxTimeVariation.delayBlocks]
 * @param {BigInt} [params.sequencerInboxMaxTimeVariation.futureBlocks]
 * @param {BigInt} [params.sequencerInboxMaxTimeVariation.delaySeconds]
 * @param {BigInt} [params.sequencerInboxMaxTimeVariation.futureSeconds]
 *
 * @returns {Object} {@link CreateRollupPrepareDeploymentParamsConfigResult}
 *
 * @example
 * const config = createRollupPrepareDeploymentParamsConfig(parentPublicClient, {
 *   chainId: BigInt(chainId),
 *   owner: deployer.address,
 *   chainConfig: prepareChainConfig({
 *     chainId,
 *     arbitrum: {
 *       InitialChainOwner: deployer.address,
 *       DataAvailabilityCommittee: true,
 *     },
 *   }),
 * });
 */
export function createRollupPrepareDeploymentParamsConfig<TChain extends Chain | undefined>(
  client: Client<Transport, TChain>,
  {
    chainConfig,
    confirmPeriodBlocks,
    challengeGracePeriodBlocks,
    minimumAssertionPeriod,
    validatorAfkBlocks,
    sequencerInboxMaxTimeVariation,
    ...params
  }: CreateRollupPrepareDeploymentParamsConfigParams,
): CreateRollupPrepareDeploymentParamsConfigResult {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } = validateParentChain(client);

  let paramsByParentBlockTime: {
    confirmPeriodBlocks: bigint;
    challengeGracePeriodBlocks: bigint;
    minimumAssertionPeriod: bigint;
    validatorAfkBlocks: bigint;
    sequencerInboxMaxTimeVariation: SequencerInboxMaxTimeVariation;
  };

  if (parentChainIsCustom) {
    if (typeof confirmPeriodBlocks === 'undefined') {
      throw new Error(
        `"params.confirmPeriodBlocks" must be provided when using a custom parent chain.`,
      );
    }

    if (typeof challengeGracePeriodBlocks === 'undefined') {
      throw new Error(
        `"params.challengeGracePeriodBlocks" must be provided when using a custom parent chain.`,
      );
    }

    if (typeof minimumAssertionPeriod === 'undefined') {
      throw new Error(
        `"params.minimumAssertionPeriod" must be provided when using a custom parent chain.`,
      );
    }

    if (typeof validatorAfkBlocks === 'undefined') {
      throw new Error(
        `"params.validatorAfkBlocks" must be provided when using a custom parent chain.`,
      );
    }

    if (typeof sequencerInboxMaxTimeVariation === 'undefined') {
      throw new Error(
        `"params.sequencerInboxMaxTimeVariation" must be provided when using a custom parent chain.`,
      );
    }

    paramsByParentBlockTime = {
      confirmPeriodBlocks,
      challengeGracePeriodBlocks,
      minimumAssertionPeriod,
      validatorAfkBlocks,
      sequencerInboxMaxTimeVariation,
    };
  } else {
    const defaultConfirmPeriodBlocks = getDefaultConfirmPeriodBlocks(parentChainId);
    const defaultChallengeGracePeriodBlocks = getDefaultChallengeGracePeriodBlocks(parentChainId);
    const defaultMinimumAssertionPeriod = getDefaultMinimumAssertionPeriod(parentChainId);
    const defaultValidatorAfkBlocks = getDefaultValidatorAfkBlocks(parentChainId);
    const defaultSequencerInboxMTV = getDefaultSequencerInboxMaxTimeVariation(parentChainId);

    paramsByParentBlockTime = {
      confirmPeriodBlocks: confirmPeriodBlocks ?? defaultConfirmPeriodBlocks,
      challengeGracePeriodBlocks: challengeGracePeriodBlocks ?? defaultChallengeGracePeriodBlocks,
      minimumAssertionPeriod: minimumAssertionPeriod ?? defaultMinimumAssertionPeriod,
      validatorAfkBlocks: validatorAfkBlocks ?? defaultValidatorAfkBlocks,
      sequencerInboxMaxTimeVariation: sequencerInboxMaxTimeVariation ?? defaultSequencerInboxMTV,
    };
  }

  const defaultsForStake = {
    stakeToken: getWethAddress(client),
    baseStake: parseEther('1'),
    miniStakeValues: [BigInt(0), BigInt(1), BigInt(1)],
    loserStakeEscrow: params.owner,
  };

  return {
    ...createRollupPrepareDeploymentParamsConfigDefaults(),
    ...defaultsForStake,
    ...paramsByParentBlockTime,
    ...params,
    chainConfig: JSON.stringify(
      typeof chainConfig !== 'undefined'
        ? // if config is provided by user, sort keys for consistency
          prepareChainConfigSortKeys(chainConfig)
        : // if config is provided by prepareChainConfig, keys are already sorted
          prepareChainConfig({
            chainId: Number(params.chainId),
            arbitrum: { InitialChainOwner: params.owner },
          }),
    ),
  };
}
