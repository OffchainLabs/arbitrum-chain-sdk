import {
  Address,
  Chain,
  PublicClient,
  Transport,
  WalletClient,
  getAddress,
  pad,
  parseAbi,
} from 'viem';

import arbChildToParentRewardRouter from '@offchainlabs/fund-distribution-contracts/out/ArbChildToParentRewardRouter.sol/ArbChildToParentRewardRouter.json';
import opChildToParentRewardRouter from '@offchainlabs/fund-distribution-contracts/out/OpChildToParentRewardRouter.sol/OpChildToParentRewardRouter.json';

import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';
import { Prettify } from './types/utils';
import { validateParentChain } from './types/ParentChain';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';

/**
 * This type is for the params of the feeRouterDeployChildToParentRewardRouter function
 */
export type FeeRouterDeployChildToParentRewardRouterParams<TChain extends Chain | undefined> =
  Prettify<
    WithTokenBridgeCreatorAddressOverride<{
      parentChainPublicClient: PublicClient<Transport, TChain>;
      orbitChainWalletClient: WalletClient;
      parentChainTargetAddress: Address;
      minDistributionInvervalSeconds?: bigint;
      rollup?: Address;
      parentChainTokenAddress?: Address;
    }>
  >;

/**
 * This type is for the params of the feeRouterDeployChildToParentRewardRouter function
 */
export type FeeRouterDeployOpChildToParentRewardRouterParams = Prettify<{
  childChainWalletClient: WalletClient;
  parentChainTargetAddress: Address;
  minDistributionInvervalSeconds?: bigint;
  parentChainTokenAddress?: Address;
  childChainTokenAddress?: Address;
}>;

// Default minimum distribution interval seconds
const DEFAULT_MIN_DISTRIBUTION_INVERVAL_SECONDS = BigInt(60 * 60 * 24 * 7); // 1 week

// Default address 1
const oneAddress = getAddress(
  pad('0x1', {
    size: 20,
  }),
);

/**
 * Deploys the ArbChildToParentRewardRouter smart contract and initializes it with the provided configuration.
 *
 * If the router is intended to route the native asset, there's no need to include the rollup and parentChainTokenAddress parameters.
 *
 * References:
 * - ArbChildToParentRewardRouter contract: https://github.com/OffchainLabs/fund-distribution-contracts/blob/main/src/FeeRouter/ArbChildToParentRewardRouter.sol
 *
 * Example: [Setup fee routing for the AEP](https://github.com/OffchainLabs/arbitrum-orbit-sdk/blob/main/examples/setup-aep-fee-router/index.ts)
 *
 * @param {FeeRouterDeployChildToParentRewardRouterParams} feeRouterDeployChildToParentRewardRouterParams {@link FeeRouterDeployChildToParentRewardRouterParams}
 * @param {PublicClient} feeRouterDeployChildToParentRewardRouterParams.parentChainPublicClient - The parent chain Viem public client
 * @param {WalletClient} feeRouterDeployChildToParentRewardRouterParams.orbitChainWalletClient - The orbit chain Viem wallet client (this account will deploy the contract)
 * @param {Address} feeRouterDeployChildToParentRewardRouterParams.parentChainTargetAddress - The address where funds will be sent in the parent chain
 * @param {bigint} feeRouterDeployChildToParentRewardRouterParams.minDistributionInvervalSeconds - [Optional] The number of seconds that needs to pass before funds can be sent again (to prevent griefing)
 * @param {Address} feeRouterDeployChildToParentRewardRouterParams.rollup - [Optional] If sending a token different than the native token of the Orbit chain, the Rollup contract address of the chain
 * @param {Address} feeRouterDeployChildToParentRewardRouterParams.parentChainTokenAddress - [Optional] If sending a token different than the native token of the Orbit chain, address of the token in the parent chain
 *
 * @returns Promise<0x${string}> - The hash of the deployment transaction
 *
 * @example
 * const childToParentRewardRouterDeploymentTransactionHash = await feeRouterDeployChildToParentRewardRouter({
 *   parentChainPublicClient,
 *   orbitChainWalletClient,
 *   parentChainTargetAddress,
 * });
 * const childToParentRewardRouterDeploymentTransactionReceipt =
 *   await nitroTestnodeL2Client.waitForTransactionReceipt({
 *     hash: childToParentRewardRouterDeploymentTransactionHash,
 *   });
 * const childToParentRewardRouterAddress = getAddress(
 *   childToParentRewardRouterDeploymentTransactionReceipt.contractAddress as `0x${string}`,
 * );
 */
export async function feeRouterDeployChildToParentRewardRouter<TChain extends Chain | undefined>({
  parentChainPublicClient,
  orbitChainWalletClient,
  parentChainTargetAddress,
  minDistributionInvervalSeconds,
  rollup,
  parentChainTokenAddress,
  tokenBridgeCreatorAddressOverride,
}: FeeRouterDeployChildToParentRewardRouterParams<TChain>) {
  validateParentChain(parentChainPublicClient);

  const constructorArguments = {
    parentChainTargetAddress,
    minDistributionInvervalSeconds:
      minDistributionInvervalSeconds ?? DEFAULT_MIN_DISTRIBUTION_INVERVAL_SECONDS,

    // setting the default values here
    // (when routing the native token, these three arguments need to be set to the oneAddress)
    parentChainTokenAddress: oneAddress,
    orbitChainTokenAddress: oneAddress,
    orbitChainGatewayRouter: oneAddress,
  };

  if (parentChainTokenAddress) {
    // routing a token different than the native token of the Orbit chain

    if (!rollup) {
      throw new Error(
        'Rollup address is needed when routing a token different than the native token',
      );
    }

    // obtain the GatewayRouter of the Orbit chain
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
    const orbitChainGatewayRouter = tokenBridgeContracts.orbitChainContracts.router;

    // obtain the token address in the Orbit chain
    // (we can use either gateway router to obtain the "L2 token address")
    const orbitChainTokenAddress = await parentChainPublicClient.readContract({
      address: tokenBridgeContracts.parentChainContracts.router,
      abi: parseAbi(['function calculateL2TokenAddress(address) view returns (address)']),
      functionName: 'calculateL2TokenAddress',
      args: [parentChainTokenAddress],
    });

    // replacing the values in the arguments object
    constructorArguments.parentChainTokenAddress = parentChainTokenAddress;
    constructorArguments.orbitChainTokenAddress = orbitChainTokenAddress;
    constructorArguments.orbitChainGatewayRouter = orbitChainGatewayRouter;
  }

  const transactionHash = await orbitChainWalletClient.deployContract({
    abi: arbChildToParentRewardRouter.abi,
    account: orbitChainWalletClient.account!,
    chain: orbitChainWalletClient.chain,
    args: [
      constructorArguments.parentChainTargetAddress,
      constructorArguments.minDistributionInvervalSeconds,
      constructorArguments.parentChainTokenAddress,
      constructorArguments.orbitChainTokenAddress,
      constructorArguments.orbitChainGatewayRouter,
    ],
    bytecode: arbChildToParentRewardRouter.bytecode.object as `0x${string}`,
  });

  return transactionHash;
}

/**
 * Deploys the OpChildToParentRewardRouter smart contract and initializes it with the provided configuration.
 *
 * If the router is intended to route the native asset, there's no need to include the rollup and parentChainTokenAddress parameters.
 *
 * References:
 * - OpChildToParentRewardRouter contract: https://github.com/OffchainLabs/fund-distribution-contracts/blob/main/src/FeeRouter/OpChildToParentRewardRouter.sol
 *
 * Example: [Setup fee routing for the AEP](https://github.com/OffchainLabs/arbitrum-orbit-sdk/blob/main/examples/setup-aep-fee-router/index.ts)
 *
 * @param {FeeRouterDeployChildToParentRewardRouterParams} feeRouterDeployChildToParentRewardRouterParams {@link FeeRouterDeployChildToParentRewardRouterParams}
 * @param {WalletClient} feeRouterDeployChildToParentRewardRouterParams.orbitChainWalletClient - The orbit chain Viem wallet client (this account will deploy the contract)
 * @param {Address} feeRouterDeployChildToParentRewardRouterParams.parentChainTargetAddress - The address where funds will be sent in the parent chain
 * @param {bigint} feeRouterDeployChildToParentRewardRouterParams.minDistributionInvervalSeconds - [Optional] The number of seconds that needs to pass before funds can be sent again (to prevent griefing)
 * @param {Address} feeRouterDeployChildToParentRewardRouterParams.parentChainTokenAddress - [Optional] If sending a token different than the native token of the Orbit chain, address of the token on the parent chain. Must be provided if childChainTokenAddress is provided.
 * @param {Address} feeRouterDeployChildToParentRewardRouterParams.childChainTokenAddress - [Optional] If sending a token different than the native token of the Orbit chain, address of the token on the child chain. Must be provided if parentChainTokenAddress is provided.
 *
 * @returns Promise<0x${string}> - The hash of the deployment transaction
 *
 * @example
 * const childToParentRewardRouterDeploymentTransactionHash = await feeRouterDeployOpChildToParentRewardRouter({
 *   parentChainPublicClient,
 *   orbitChainWalletClient,
 *   parentChainTargetAddress,
 * });
 * const childToParentRewardRouterDeploymentTransactionReceipt =
 *   await nitroTestnodeL2Client.waitForTransactionReceipt({
 *     hash: childToParentRewardRouterDeploymentTransactionHash,
 *   });
 * const childToParentRewardRouterAddress = getAddress(
 *   childToParentRewardRouterDeploymentTransactionReceipt.contractAddress as `0x${string}`,
 * );
 */
export async function feeRouterDeployOpChildToParentRewardRouter({
  childChainWalletClient,
  parentChainTargetAddress,
  minDistributionInvervalSeconds,
  parentChainTokenAddress,
  childChainTokenAddress,
}: FeeRouterDeployOpChildToParentRewardRouterParams) {
  if (
    (parentChainTargetAddress != undefined && childChainTokenAddress == undefined) ||
    (parentChainTokenAddress == undefined && childChainTokenAddress != undefined)
  ) {
    throw new Error(
      'Both parentChainTokenAddress and childChainTokenAddress must be provided together.',
    );
  }

  const constructorArguments = {
    parentChainTargetAddress,
    minDistributionInvervalSeconds:
      minDistributionInvervalSeconds ?? DEFAULT_MIN_DISTRIBUTION_INVERVAL_SECONDS,
    parentChainTokenAddress: parentChainTokenAddress ?? oneAddress,
    childChainTokenAddress: childChainTokenAddress ?? oneAddress,
  };

  const transactionHash = await childChainWalletClient.deployContract({
    abi: opChildToParentRewardRouter.abi,
    account: childChainWalletClient.account!,
    chain: childChainWalletClient.chain,
    args: [
      constructorArguments.parentChainTargetAddress,
      constructorArguments.minDistributionInvervalSeconds,
      constructorArguments.parentChainTokenAddress,
      constructorArguments.childChainTokenAddress,
    ],
    bytecode: opChildToParentRewardRouter.bytecode.object as `0x${string}`,
  });

  return transactionHash;
}
