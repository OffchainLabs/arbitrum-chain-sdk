import { Address, PublicClient, Transport, Chain } from 'viem';

import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';

import { Prettify } from './types/utils';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';
import { TokenBridgeContracts } from './types/TokenBridgeContracts';
import { getTokenBridgeCreatorAddress } from './utils/getTokenBridgeCreatorAddress';

export type CreateTokenBridgeFetchTokenBridgeContractsParams<TChain extends Chain | undefined> =
  Prettify<
    WithTokenBridgeCreatorAddressOverride<{
      inbox: Address;
      parentChainPublicClient: PublicClient<Transport, TChain>;
    }>
  >;

export async function createTokenBridgeFetchTokenBridgeContracts<TChain extends Chain | undefined>({
  inbox,
  parentChainPublicClient,
  tokenBridgeCreatorAddressOverride,
}: CreateTokenBridgeFetchTokenBridgeContractsParams<TChain>): Promise<TokenBridgeContracts> {
  const tokenBridgeCreatorAddress =
    tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(parentChainPublicClient);

  // getting parent chain addresses
  const [
    parentChainRouter,
    parentChainStandardGateway,
    parentChainCustomGateway,
    parentChainWethGateway,
    parentChainWeth,
  ] = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'inboxToL1Deployment',
    args: [inbox],
  });

  const parentChainMulticall = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'l1Multicall',
  });

  const parentChainContracts = {
    router: parentChainRouter,
    standardGateway: parentChainStandardGateway,
    customGateway: parentChainCustomGateway,
    wethGateway: parentChainWethGateway,
    weth: parentChainWeth,
    multicall: parentChainMulticall,
  };

  // getting orbit chain addresses
  const [
    orbitChainRouter,
    orbitChainStandardGateway,
    orbitChainCustomGateway,
    orbitChainWethGateway,
    orbitChainWeth,
    orbitChainProxyAdmin,
    orbitChainBeaconProxyFactory,
    orbitChainUpgradeExecutor,
    orbitChainMulticall,
  ] = await parentChainPublicClient.readContract({
    address: tokenBridgeCreatorAddress,
    abi: tokenBridgeCreatorABI,
    functionName: 'inboxToL2Deployment',
    args: [inbox],
  });
  const orbitChainContracts = {
    router: orbitChainRouter,
    standardGateway: orbitChainStandardGateway,
    customGateway: orbitChainCustomGateway,
    wethGateway: orbitChainWethGateway,
    weth: orbitChainWeth,
    proxyAdmin: orbitChainProxyAdmin,
    beaconProxyFactory: orbitChainBeaconProxyFactory,
    upgradeExecutor: orbitChainUpgradeExecutor,
    multicall: orbitChainMulticall,
  };

  return {
    parentChainContracts,
    orbitChainContracts,
  };
}
