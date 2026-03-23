import { Address, PublicClient, Transport, Chain, encodeFunctionData, parseAbi } from 'viem';

import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';
import { createRollupFetchCoreContracts } from './createRollupFetchCoreContracts';
import { getEstimateForSettingGateway } from './createTokenBridge-ethers';
import { gatewayRouterABI } from './contracts/GatewayRouter';
import { GasOverrideOptions, applyPercentIncrease } from './utils/gasOverrides';
import { Prettify } from './types/utils';
import { validateParentChain } from './types/ParentChain';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { registerNewNetwork } from './utils/registerNewNetwork';
import { publicClientToProvider } from './ethers-compat/publicClientToProvider';

export type TransactionRequestRetryableGasOverrides = {
  gasLimit?: GasOverrideOptions;
  maxFeePerGas?: GasOverrideOptions;
  maxSubmissionCost?: GasOverrideOptions;
};

export type CreateTokenBridgePrepareRegisterWethGatewayTransactionRequestParams<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
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
    orbitChainPublicClient: PublicClient<Transport, TOrbitChain>;
    account: Address;
    retryableGasOverrides?: TransactionRequestRetryableGasOverrides;
  }>
>;

export async function createTokenBridgePrepareSetWethGatewayTransactionRequest<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
>({
  rollup,
  rollupDeploymentBlockNumber,
  parentChainPublicClient,
  orbitChainPublicClient,
  account,
  retryableGasOverrides,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgePrepareRegisterWethGatewayTransactionRequestParams<TParentChain, TOrbitChain>) {
  const { chainId } = validateParentChain(parentChainPublicClient);

  // Ensure that networks are registered
  await registerNewNetwork(
    publicClientToProvider(parentChainPublicClient),
    publicClientToProvider(orbitChainPublicClient),
    rollup,
  );

  // check for custom fee token chain
  if (
    await isCustomFeeTokenChain({
      rollup,
      parentChainPublicClient,
    })
  ) {
    throw new Error('chain is custom fee token chain, no need to register the weth gateway.');
  }

  // get inbox address from rollup
  const inbox = await parentChainPublicClient.readContract({
    address: rollup,
    abi: parseAbi(['function inbox() view returns (address)']),
    functionName: 'inbox',
  });

  // get token bridge contracts
  const tokenBridgeContracts = await createTokenBridgeFetchTokenBridgeContracts({
    inbox,
    parentChainPublicClient,
    tokenBridgeCreatorAddressOverride,
  });

  // check whether the weth gateway is already registered in the router
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

  // encode data for the setGateways call
  // (we first encode dummy data, to get the retryable message estimates)
  const setGatewaysDummyCalldata = encodeFunctionData({
    abi: gatewayRouterABI,
    functionName: 'setGateways',
    args: [
      [tokenBridgeContracts.parentChainContracts.weth],
      [tokenBridgeContracts.parentChainContracts.wethGateway],
      1n, // _maxGas
      1n, // _gasPriceBid
      1n, // _maxSubmissionCost
    ],
  });
  const retryableTicketGasEstimates = await getEstimateForSettingGateway(
    account,
    rollupCoreContracts.upgradeExecutor,
    tokenBridgeContracts.parentChainContracts.router,
    setGatewaysDummyCalldata,
    parentChainPublicClient,
    orbitChainPublicClient,
  );

  //// apply gas overrides
  const gasLimit =
    retryableGasOverrides && retryableGasOverrides.gasLimit
      ? applyPercentIncrease({
          base: retryableGasOverrides.gasLimit.base ?? retryableTicketGasEstimates.gasLimit,
          percentIncrease: retryableGasOverrides.gasLimit.percentIncrease,
        })
      : retryableTicketGasEstimates.gasLimit;

  const maxFeePerGas =
    retryableGasOverrides && retryableGasOverrides.maxFeePerGas
      ? applyPercentIncrease({
          base: retryableGasOverrides.maxFeePerGas.base ?? retryableTicketGasEstimates.maxFeePerGas,
          percentIncrease: retryableGasOverrides.maxFeePerGas.percentIncrease,
        })
      : retryableTicketGasEstimates.maxFeePerGas;

  const maxSubmissionCost =
    retryableGasOverrides && retryableGasOverrides.maxSubmissionCost
      ? applyPercentIncrease({
          base:
            retryableGasOverrides.maxSubmissionCost.base ??
            retryableTicketGasEstimates.maxSubmissionCost,
          percentIncrease: retryableGasOverrides.maxSubmissionCost.percentIncrease,
        })
      : retryableTicketGasEstimates.maxSubmissionCost;

  const deposit = gasLimit * maxFeePerGas + maxSubmissionCost;

  // (and then we encode the real data, to send the transaction)
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

  // prepare the transaction request with a call to the upgrade executor
  // @ts-expect-error -- todo: fix viem type issue
  const request = await parentChainPublicClient.prepareTransactionRequest({
    chain: parentChainPublicClient.chain,
    to: rollupCoreContracts.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        tokenBridgeContracts.parentChainContracts.router, // target
        setGatewaysCalldata, // targetCallData
      ],
    }),
    value: deposit,
    account,
  });

  return { ...request, chainId };
}
