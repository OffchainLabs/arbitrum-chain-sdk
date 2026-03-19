import { Address, PublicClient, Transport, Chain, encodeFunctionData, parseAbi } from 'viem';

import { validateParentChain } from './types/ParentChain';
import { isCustomFeeTokenChain } from './utils/isCustomFeeTokenChain';
import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';
import { createRollupFetchCoreContracts } from './createRollupFetchCoreContracts';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';
import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { enqueueDefaultMaxGasPrice } from './constants';

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
] as const;

export type EnqueueSetWethGatewayParams<TParentChain extends Chain | undefined> = Prettify<
  WithTokenBridgeCreatorAddressOverride<{
    rollup: Address;
    account: Address;
    rollupDeploymentBlockNumber?: bigint;
    parentChainPublicClient: PublicClient<Transport, TParentChain>;
    gasLimit: bigint;
    maxFeePerGas?: bigint;
    maxSubmissionCost: bigint;
  }>
>;

export async function enqueueSetWethGateway<TParentChain extends Chain | undefined>({
  rollup,
  account,
  rollupDeploymentBlockNumber,
  parentChainPublicClient,
  gasLimit,
  maxFeePerGas = enqueueDefaultMaxGasPrice,
  maxSubmissionCost,
  tokenBridgeCreatorAddressOverride,
}: EnqueueSetWethGatewayParams<TParentChain>) {
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

  const deposit = gasLimit * maxFeePerGas + maxSubmissionCost;

  const setGatewaysCalldata = encodeFunctionData({
    abi: parentChainGatewayRouterAbi,
    functionName: 'setGateways',
    args: [
      [tokenBridgeContracts.parentChainContracts.weth],
      [tokenBridgeContracts.parentChainContracts.wethGateway],
      gasLimit,
      maxFeePerGas,
      maxSubmissionCost,
    ],
  });

  // @ts-expect-error -- todo: fix viem type issue
  const request = await parentChainPublicClient.prepareTransactionRequest({
    chain: parentChainPublicClient.chain,
    to: rollupCoreContracts.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        tokenBridgeContracts.parentChainContracts.router,
        setGatewaysCalldata,
      ],
    }),
    value: deposit,
    account,
  });

  return { ...request, chainId };
}
