import { Address, PublicClient, Transport, Chain, encodeFunctionData, parseAbi } from 'viem';

import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';
import { createRollupFetchCoreContracts } from './createRollupFetchCoreContracts';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { gatewayRouterABI } from './contracts/GatewayRouter';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { enqueueDefaultMaxGasPrice, enqueueDefaultGasLimitForWethGateway } from './constants';

export type EnqueueTokenBridgePrepareSetWethGatewayTransactionRequestParams<
  TParentChain extends Chain | undefined,
> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    /**
     * Address of the Rollup contract.
     */
    rollup: Address;
    account: Address;
    /**
     * Number of the block in which the Rollup contract was deployed.
     *
     * This parameter is used to reduce the span of blocks to query, so it doesn't have to be exactly the right block number.
     * However, for the query to work properly, it has to be **less than or equal to** the right block number.
     */
    rollupDeploymentBlockNumber?: bigint;
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    gasLimit?: bigint;
    maxGasPrice?: bigint;
    maxSubmissionCost: bigint;
  }>
>;

/**
 * Prepares the transaction to register the WETH gateway on the parent chain router via the
 * UpgradeExecutor. Must be called after the `enqueueTokenBridgePrepareTransactionRequest` transaction
 * has confirmed on the parent chain. Unlike {@link createTokenBridgePrepareSetWethGatewayTransactionRequest},
 * this function does not require an orbit chain connection -- retryable gas parameters are provided
 * by the caller.
 */
export async function enqueueTokenBridgePrepareSetWethGatewayTransactionRequest<
  TParentChain extends Chain | undefined,
>({
  rollup,
  account,
  rollupDeploymentBlockNumber,
  parentChainPublicClient,
  gasLimit = enqueueDefaultGasLimitForWethGateway,
  maxGasPrice = enqueueDefaultMaxGasPrice,
  maxSubmissionCost,
  tokenBridgeCreatorAddressOverride,
}: EnqueueTokenBridgePrepareSetWethGatewayTransactionRequestParams<TParentChain>) {
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

  const deposit = gasLimit * maxGasPrice + maxSubmissionCost;

  const setGatewaysCalldata = encodeFunctionData({
    abi: gatewayRouterABI,
    functionName: 'setGateways',
    args: [
      [tokenBridgeContracts.parentChainContracts.weth],
      [tokenBridgeContracts.parentChainContracts.wethGateway],
      gasLimit, // _maxGas
      maxGasPrice, // _gasPriceBid
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
