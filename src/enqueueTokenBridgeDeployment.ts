import { Address, PublicClient, Transport, Chain, encodeFunctionData, zeroAddress } from 'viem';

import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';
import { rollupABI } from './contracts/Rollup';
import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import {
  TransactionRequestGasOverrides,
  applyPercentIncrease,
} from './utils/gasOverrides';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';
import { enqueueDefaultMaxGasPrice } from './constants';

export type EnqueueTokenBridgeDeploymentParams<TParentChain extends Chain | undefined> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    rollup: Address;
    rollupOwner: Address;
    account: Address;
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    maxGasForContracts: bigint;
    maxGasPrice?: bigint;
    retryableFee: bigint;
    gasOverrides?: TransactionRequestGasOverrides;
  }>
>;

export async function enqueueTokenBridgeDeployment<TParentChain extends Chain | undefined>({
  rollup,
  rollupOwner,
  account,
  parentChainPublicClient,
  maxGasForContracts,
  maxGasPrice = enqueueDefaultMaxGasPrice,
  retryableFee,
  gasOverrides,
  tokenBridgeCreatorAddressOverride,
}: EnqueueTokenBridgeDeploymentParams<TParentChain>) {
  const { chainId } = validateParentChain(parentChainPublicClient);

  const tokenBridgeCreatorAddress =
    tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(parentChainPublicClient);

  const inbox = await parentChainPublicClient.readContract({
    address: rollup,
    abi: rollupABI,
    functionName: 'inbox',
  });

  // Parent-chain-only idempotency check: if router is non-zero, bridge is already deployed
  const [router] = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'inboxToL2Deployment',
    args: [inbox],
  });
  if (router !== zeroAddress) {
    throw new Error(`Token bridge contracts for Rollup ${rollup} are already deployed`);
  }

  const chainUsesCustomFee = await isCustomFeeTokenChain({
    rollup,
    parentChainPublicClient,
  });

  // @ts-expect-error -- todo: fix viem type issue
  const request = await parentChainPublicClient.prepareTransactionRequest({
    chain: parentChainPublicClient.chain,
    to: tokenBridgeCreatorAddress,
    data: encodeFunctionData({
      abi: tokenBridgeCreatorABI,
      functionName: 'createTokenBridge',
      args: [inbox, rollupOwner, maxGasForContracts, maxGasPrice],
    }),
    value: chainUsesCustomFee ? 0n : retryableFee,
    account,
    // if the base gas limit override was provided, hardcode gas to 0 to skip estimation
    gas: typeof gasOverrides?.gasLimit?.base !== 'undefined' ? 0n : undefined,
  });

  if (gasOverrides && gasOverrides.gasLimit) {
    request.gas = applyPercentIncrease({
      base: gasOverrides.gasLimit.base ?? request.gas!,
      percentIncrease: gasOverrides.gasLimit.percentIncrease,
    });
  }

  return { ...request, chainId };
}
