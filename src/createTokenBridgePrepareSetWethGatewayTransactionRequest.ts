import { Address, PublicClient, Transport, Chain, encodeFunctionData, parseAbi } from 'viem';

import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';
import { createRollupFetchCoreContracts } from './createRollupFetchCoreContracts';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { GasOverrideOptions, applyPercentIncrease } from './utils/gasOverrides';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import {
  createTokenBridgeDefaultMaxGasPrice,
  createTokenBridgeDefaultGasLimitForWethGateway,
  defaultSubmissionFeePercentIncrease,
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

const parentChainGatewayRouterAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'l1TokenToGateway',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: '_token',
        type: 'address[]',
      },
      {
        internalType: 'address[]',
        name: '_gateway',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: '_maxGas',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_gasPriceBid',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_maxSubmissionCost',
        type: 'uint256',
      },
    ],
    name: 'setGateways',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
];

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
    abi: parentChainGatewayRouterAbi,
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

  // (we first encode dummy data, to get the retryable message estimates)
  const setGatewaysDummyCalldata = encodeFunctionData({
    abi: parentChainGatewayRouterAbi,
    functionName: 'setGateways',
    args: [
      [tokenBridgeContracts.parentChainContracts.weth],
      [tokenBridgeContracts.parentChainContracts.wethGateway],
      1n, // _maxGas
      1n, // _gasPriceBid
      1n, // _maxSubmissionCost
    ],
  });
  const calldataSize = BigInt((setGatewaysDummyCalldata.length - 2) / 2);
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

  const maxSubmissionCost = retryableGasOverrides?.maxSubmissionCost
    ? applyPercentIncrease({
        base: retryableGasOverrides.maxSubmissionCost.base ?? maxSubmissionCostEstimate,
        percentIncrease: retryableGasOverrides.maxSubmissionCost.percentIncrease,
      })
    : applyPercentIncrease({
        base: maxSubmissionCostEstimate,
        percentIncrease: defaultSubmissionFeePercentIncrease,
      });

  const deposit = gasLimit * maxFeePerGas + maxSubmissionCost;

  const setGatewaysCalldata = encodeFunctionData({
    abi: parentChainGatewayRouterAbi,
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
