import { Address, PublicClient, Transport, Chain, encodeFunctionData, zeroAddress } from 'viem';

import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';
import { rollupABI } from './contracts/Rollup';
import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import {
  GasOverrideOptions,
  TransactionRequestGasOverrides,
  applyPercentIncrease,
} from './utils/gasOverrides';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';
import {
  createTokenBridgeDefaultMaxGasPrice,
  createTokenBridgeDefaultMaxGasForContracts,
  defaultSubmissionFeePercentIncrease,
} from './constants';
import {
  getFactoryDeploymentDataSize,
  getContractsDeploymentData,
} from './createTokenBridge-ethers';
import { publicClientToProvider } from './ethers-compat/publicClientToProvider';
import { calculateRetryableSubmissionFee } from './calculateRetryableSubmissionFee';

export type TransactionRequestRetryableGasOverrides = {
  maxSubmissionCostForFactory?: GasOverrideOptions;
  maxGasForFactory?: GasOverrideOptions;
  maxSubmissionCostForContracts?: GasOverrideOptions;
  maxGasForContracts?: GasOverrideOptions;
  maxGasPrice?: bigint;
};

export type CreateTokenBridgePrepareTransactionRequestParams<
  TParentChain extends Chain | undefined,
> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    params: { rollup: Address; rollupOwner: Address };
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    account: Address;
    gasOverrides?: TransactionRequestGasOverrides;
    retryableGasOverrides?: TransactionRequestRetryableGasOverrides;
  }>
>;

export async function createTokenBridgePrepareTransactionRequest<
  TParentChain extends Chain | undefined,
>({
  params,
  parentChainPublicClient,
  account,
  gasOverrides,
  retryableGasOverrides,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgePrepareTransactionRequestParams<TParentChain>) {
  const { chainId } = validateParentChain(parentChainPublicClient);

  const tokenBridgeCreatorAddress =
    tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(parentChainPublicClient);

  const inbox = await parentChainPublicClient.readContract({
    address: params.rollup,
    abi: rollupABI,
    functionName: 'inbox',
  });

  // Parent-chain-only idempotency check.
  // If router is non-zero, a prior createTokenBridge tx has executed on the parent chain.
  // If the L2 retryables failed, they should be manually redeemed rather than redeployed.
  const [router] = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'inboxToL2Deployment',
    args: [inbox],
  });
  if (router !== zeroAddress) {
    throw new Error(
      `Token bridge deployment for Rollup ${params.rollup} was already initiated on the parent chain. ` +
        `If the bridge is not functional, the L2 retryable tickets may need to be manually redeemed.`,
    );
  }

  const maxGasForFactoryEstimate = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'gasLimitForL2FactoryDeployment',
  });

  const l1Provider = publicClientToProvider(parentChainPublicClient);
  const { dataSize: contractsDataSize } = await getContractsDeploymentData(
    tokenBridgeCreatorAddress,
    l1Provider,
  );

  const [submissionCostForFactoryEstimate, submissionCostForContractsEstimate] = await Promise.all([
    calculateRetryableSubmissionFee(
      parentChainPublicClient,
      inbox,
      BigInt(getFactoryDeploymentDataSize()),
    ),
    calculateRetryableSubmissionFee(parentChainPublicClient, inbox, BigInt(contractsDataSize)),
  ]);

  //// apply gas overrides
  const maxSubmissionCostForFactory = retryableGasOverrides?.maxSubmissionCostForFactory
    ? applyPercentIncrease({
        base:
          retryableGasOverrides.maxSubmissionCostForFactory.base ?? submissionCostForFactoryEstimate,
        percentIncrease: retryableGasOverrides.maxSubmissionCostForFactory.percentIncrease,
      })
    : applyPercentIncrease({
        base: submissionCostForFactoryEstimate,
        percentIncrease: defaultSubmissionFeePercentIncrease,
      });

  const maxGasForFactory =
    retryableGasOverrides && retryableGasOverrides.maxGasForFactory
      ? applyPercentIncrease({
          base: retryableGasOverrides.maxGasForFactory.base ?? maxGasForFactoryEstimate,
          percentIncrease: retryableGasOverrides.maxGasForFactory.percentIncrease,
        })
      : maxGasForFactoryEstimate;

  const maxSubmissionCostForContracts = retryableGasOverrides?.maxSubmissionCostForContracts
    ? applyPercentIncrease({
        base:
          retryableGasOverrides.maxSubmissionCostForContracts.base ??
          submissionCostForContractsEstimate,
        percentIncrease: retryableGasOverrides.maxSubmissionCostForContracts.percentIncrease,
      })
    : applyPercentIncrease({
        base: submissionCostForContractsEstimate,
        percentIncrease: defaultSubmissionFeePercentIncrease,
      });

  const maxGasForContracts =
    retryableGasOverrides && retryableGasOverrides.maxGasForContracts
      ? applyPercentIncrease({
          base:
            retryableGasOverrides.maxGasForContracts.base ??
            createTokenBridgeDefaultMaxGasForContracts,
          percentIncrease: retryableGasOverrides.maxGasForContracts.percentIncrease,
        })
      : createTokenBridgeDefaultMaxGasForContracts;

  const maxGasPrice = retryableGasOverrides?.maxGasPrice ?? createTokenBridgeDefaultMaxGasPrice;

  const chainUsesCustomFee = await isCustomFeeTokenChain({
    rollup: params.rollup,
    parentChainPublicClient,
  });

  const retryableFee =
    maxSubmissionCostForFactory +
    maxSubmissionCostForContracts +
    maxGasPrice * (maxGasForContracts + maxGasForFactory);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await parentChainPublicClient.prepareTransactionRequest({
    chain: parentChainPublicClient.chain,
    to: tokenBridgeCreatorAddress,
    data: encodeFunctionData({
      abi: tokenBridgeCreatorABI,
      functionName: 'createTokenBridge',
      args: [inbox, params.rollupOwner, maxGasForContracts, maxGasPrice],
    }),
    value: chainUsesCustomFee ? 0n : retryableFee,
    account,
    // if the base gas limit override was provided, hardcode gas to 0 to skip estimation
    // we'll set the actual value in the code below
    gas: typeof gasOverrides?.gasLimit?.base !== 'undefined' ? 0n : undefined,
  });

  // potential gas overrides (gas limit)
  if (gasOverrides && gasOverrides.gasLimit) {
    request.gas = applyPercentIncrease({
      // the ! is here because we should let it error in case we don't have the estimated gas
      base: gasOverrides.gasLimit.base ?? request.gas!,
      percentIncrease: gasOverrides.gasLimit.percentIncrease,
    });
  }

  return { ...request, chainId };
}
