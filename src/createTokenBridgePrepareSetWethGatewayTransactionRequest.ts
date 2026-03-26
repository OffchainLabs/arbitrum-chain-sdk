import { Address, PublicClient, Transport, Chain, encodeFunctionData, parseAbi } from 'viem';

import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';
import { createRollupFetchCoreContracts } from './createRollupFetchCoreContracts';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { gatewayRouterABI } from './contracts/GatewayRouter';
import { GasOverrideOptions, applyPercentIncrease } from './utils/gasOverrides';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import {
  createTokenBridgeDefaultMaxGasPrice,
  createTokenBridgeDefaultGasLimitForWethGateway,
} from './constants';
import { calculateRetryableSubmissionFee } from './calculateRetryableSubmissionFee';

export type TransactionRequestRetryableGasOverrides = {
  gasLimit?: GasOverrideOptions;
  maxFeePerGas?: GasOverrideOptions;
  maxSubmissionCost?: GasOverrideOptions;
};

export type CreateTokenBridgePrepareSetWethGatewayTransactionRequestParams<
  TParentChain extends Chain | undefined,
> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    /**
     * Address of the Rollup contract.
     */
    rollup: Address;
    /**
     * Number of the block in which the Rollup contract was deployed.
     *
     * This parameter is used to reduce the span of blocks to query, so it doesn't have to be exactly the right block number.
     * However, for the query to work properly, it has to be **less than or equal to** the right block number.
     */
    rollupDeploymentBlockNumber?: bigint;
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    account: Address;
    retryableGasOverrides?: TransactionRequestRetryableGasOverrides;
  }>
>;

/**
 * Prepares the transaction to register the WETH gateway on the parent chain router via the
 * UpgradeExecutor. Must be called after the token bridge deployment transaction has confirmed on
 * the parent chain. Retryable gas parameters are estimated from parent chain state, so this
 * function does not require an orbit chain connection.
 */
export async function createTokenBridgePrepareSetWethGatewayTransactionRequest<
  TParentChain extends Chain | undefined,
>({
  rollup,
  rollupDeploymentBlockNumber,
  parentChainPublicClient,
  account,
  retryableGasOverrides,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgePrepareSetWethGatewayTransactionRequestParams<TParentChain>) {
  const { chainId } = validateParentChain(parentChainPublicClient);

  if (
    await isCustomFeeTokenChain({
      rollup,
      parentChainPublicClient,
    })
  ) {
    throw new Error('chain is custom fee token chain, no need to register the weth gateway.');
  }

  const inbox = await parentChainPublicClient.readContract({
    address: rollup,
    abi: parseAbi(['function inbox() view returns (address)']),
    functionName: 'inbox',
  });

  const tokenBridgeContracts = await createTokenBridgeFetchTokenBridgeContracts({
    inbox,
    parentChainPublicClient,
    tokenBridgeCreatorAddressOverride,
  });

  const registeredWethGateway = await parentChainPublicClient.readContract({
    address: tokenBridgeContracts.parentChainContracts.router,
    abi: gatewayRouterABI,
    functionName: 'l1TokenToGateway',
    args: [tokenBridgeContracts.parentChainContracts.weth],
  });
  if (registeredWethGateway === tokenBridgeContracts.parentChainContracts.wethGateway) {
    throw new Error('weth gateway is already registered in the router.');
  }

  const rollupCoreContracts = await createRollupFetchCoreContracts({
    rollup,
    rollupDeploymentBlockNumber,
    publicClient: parentChainPublicClient,
  });

  // Encode with placeholder values to measure data size (uint256 values are always 32 bytes in ABI encoding)
  const dummyCalldata = encodeFunctionData({
    abi: gatewayRouterABI,
    functionName: 'setGateways',
    args: [
      [tokenBridgeContracts.parentChainContracts.weth],
      [tokenBridgeContracts.parentChainContracts.wethGateway],
      0n,
      0n,
      0n,
    ],
  });
  const calldataSize = BigInt((dummyCalldata.length - 2) / 2);
  const maxSubmissionCostEstimate = await calculateRetryableSubmissionFee(
    parentChainPublicClient,
    inbox,
    calldataSize,
  );

  //// apply gas overrides
  const gasLimit =
    retryableGasOverrides && retryableGasOverrides.gasLimit
      ? applyPercentIncrease({
          base:
            retryableGasOverrides.gasLimit.base ?? createTokenBridgeDefaultGasLimitForWethGateway,
          percentIncrease: retryableGasOverrides.gasLimit.percentIncrease,
        })
      : createTokenBridgeDefaultGasLimitForWethGateway;

  const maxFeePerGas =
    retryableGasOverrides && retryableGasOverrides.maxFeePerGas
      ? applyPercentIncrease({
          base: retryableGasOverrides.maxFeePerGas.base ?? createTokenBridgeDefaultMaxGasPrice,
          percentIncrease: retryableGasOverrides.maxFeePerGas.percentIncrease,
        })
      : createTokenBridgeDefaultMaxGasPrice;

  const maxSubmissionCost =
    retryableGasOverrides && retryableGasOverrides.maxSubmissionCost
      ? applyPercentIncrease({
          base: retryableGasOverrides.maxSubmissionCost.base ?? maxSubmissionCostEstimate,
          percentIncrease: retryableGasOverrides.maxSubmissionCost.percentIncrease,
        })
      : maxSubmissionCostEstimate;

  const deposit = gasLimit * maxFeePerGas + maxSubmissionCost;

  const setGatewaysCalldata = encodeFunctionData({
    abi: gatewayRouterABI,
    functionName: 'setGateways',
    args: [
      [tokenBridgeContracts.parentChainContracts.weth],
      [tokenBridgeContracts.parentChainContracts.wethGateway],
      gasLimit, // _maxGas
      maxFeePerGas, // _gasPriceBid
      maxSubmissionCost, // _maxSubmissionCost
    ],
  });

  // @ts-expect-error -- todo: fix viem type issue
  const request = await parentChainPublicClient.prepareTransactionRequest({
    chain: parentChainPublicClient.chain,
    to: rollupCoreContracts.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [tokenBridgeContracts.parentChainContracts.router, setGatewaysCalldata],
    }),
    value: deposit,
    account,
  });

  return { ...request, chainId };
}
