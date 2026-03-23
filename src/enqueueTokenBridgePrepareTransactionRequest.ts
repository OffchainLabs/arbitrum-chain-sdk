import { Address, PublicClient, Transport, Chain, encodeFunctionData, zeroAddress } from 'viem';

import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';
import { rollupABI } from './contracts/Rollup';
import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import { TransactionRequestGasOverrides, applyPercentIncrease } from './utils/gasOverrides';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';
import { enqueueDefaultMaxGasPrice } from './constants';

export type EnqueueTokenBridgePrepareTransactionRequestParams<
  TParentChain extends Chain | undefined,
> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    params: { rollup: Address; rollupOwner: Address };
    account: Address;
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    maxGasForContracts: bigint;
    maxGasForFactory: bigint;
    maxGasPrice?: bigint;
    maxSubmissionCostForFactory: bigint;
    maxSubmissionCostForContracts: bigint;
    gasOverrides?: TransactionRequestGasOverrides;
  }>
>;

/**
 * Prepares the transaction to deploy token bridge contracts via `TokenBridgeCreator.createTokenBridge`.
 * The parent chain transaction creates retryable tickets that execute on the orbit chain when it
 * processes its inbox. Unlike {@link createTokenBridgePrepareTransactionRequest}, this function
 * does not require an orbit chain connection -- retryable gas parameters are provided by the caller.
 */
export async function enqueueTokenBridgePrepareTransactionRequest<
  TParentChain extends Chain | undefined,
>({
  params,
  account,
  parentChainPublicClient,
  maxGasForContracts,
  maxGasForFactory,
  maxGasPrice = enqueueDefaultMaxGasPrice,
  maxSubmissionCostForFactory,
  maxSubmissionCostForContracts,
  gasOverrides,
  tokenBridgeCreatorAddressOverride,
}: EnqueueTokenBridgePrepareTransactionRequestParams<TParentChain>) {
  const { chainId } = validateParentChain(parentChainPublicClient);

  const tokenBridgeCreatorAddress =
    tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(parentChainPublicClient);

  const inbox = await parentChainPublicClient.readContract({
    address: params.rollup,
    abi: rollupABI,
    functionName: 'inbox',
  });

  // Parent-chain-only idempotency check (no orbit chain client available in this flow).
  // If router is non-zero, a prior createTokenBridge tx has executed on the parent chain.
  // If the L2 retryables failed, they should be manually redeemed rather than redeployed.
  const [router] = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'inboxToL2Deployment',
    args: [inbox],
  });
  if (router !== zeroAddress) {
    throw new Error(`Token bridge contracts for Rollup ${params.rollup} are already deployed`);
  }

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
