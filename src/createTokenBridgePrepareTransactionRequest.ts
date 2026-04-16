import { z } from 'zod';
import { Address, PublicClient, Transport, Chain, encodeFunctionData } from 'viem';

import { addressSchema } from './schemas/primitives';
import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';
import { validateParentChain } from './types/ParentChain';
import { createTokenBridgeGetInputs } from './createTokenBridge-ethers';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import {
  GasOverrideOptions,
  TransactionRequestGasOverrides,
  applyPercentIncrease,
} from './utils/gasOverrides';

import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';
import { isTokenBridgeDeployed } from './isTokenBridgeDeployed';

export type TransactionRequestRetryableGasOverrides = {
  maxSubmissionCostForFactory?: GasOverrideOptions;
  maxGasForFactory?: GasOverrideOptions;
  maxSubmissionCostForContracts?: GasOverrideOptions;
  maxGasForContracts?: GasOverrideOptions;
  maxGasPrice?: bigint;
};

export type CreateTokenBridgePrepareTransactionRequestParams<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    params: { rollup: Address; rollupOwner: Address };
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    orbitChainPublicClient: PublicClient<Transport, TOrbitChain>;
    account: Address;
    gasOverrides?: TransactionRequestGasOverrides;
    retryableGasOverrides?: TransactionRequestRetryableGasOverrides;
  }>
>;

export const createTokenBridgePrepareTransactionRequestParams = z.object({
  params: z.object({ rollup: addressSchema, rollupOwner: addressSchema }),
  account: addressSchema,
  tokenBridgeCreatorAddressOverride: addressSchema.optional(),
});

export async function createTokenBridgePrepareTransactionRequest<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
>({
  params,
  parentChainPublicClient,
  orbitChainPublicClient,
  account,
  gasOverrides,
  retryableGasOverrides,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgePrepareTransactionRequestParams<TParentChain, TOrbitChain>) {
  createTokenBridgePrepareTransactionRequestParams.parse({
    params,
    account,
    tokenBridgeCreatorAddressOverride,
  });
  const { chainId } = validateParentChain(parentChainPublicClient);

  const isTokenBridgeAlreadyDeployed = await isTokenBridgeDeployed({
    parentChainPublicClient,
    orbitChainPublicClient,
    rollup: params.rollup,
    tokenBridgeCreatorAddressOverride,
  });

  if (isTokenBridgeAlreadyDeployed) {
    throw new Error(`Token bridge contracts for Rollup ${params.rollup} are already deployed`);
  }

  const tokenBridgeCreatorAddress =
    tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(parentChainPublicClient);

  const { inbox, maxGasForContracts, maxGasPrice, retryableFee } = await createTokenBridgeGetInputs(
    account,
    parentChainPublicClient,
    orbitChainPublicClient,
    tokenBridgeCreatorAddress,
    params.rollup,
    retryableGasOverrides,
  );

  const chainUsesCustomFee = await isCustomFeeTokenChain({
    rollup: params.rollup,
    parentChainPublicClient,
  });

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
    account: account,
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
