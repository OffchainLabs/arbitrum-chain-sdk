import { JsonRpcProvider } from '@ethersproject/providers';
import {
  ArbitrumNetwork,
  getArbitrumNetworkInformationFromRollup,
  registerCustomArbitrumNetwork,
} from '@arbitrum/sdk';
import { Address, Chain, PublicClient, Transport } from 'viem';

import { testnets } from '../chains';
import { getRollupInitializedEvents } from '../createRollupFetchTransactionHash';
import { publicClientToProvider } from '../ethers-compat/publicClientToProvider';
import { createTokenBridgeFetchTokenBridgeContracts } from '../createTokenBridgeFetchTokenBridgeContracts';

const isTestnet = (parentChainId: number) => {
  return testnets.some((testnet) => testnet.id === parentChainId);
};

export async function prepareArbitrumNetwork<TChain extends Chain | undefined>(
  parentChainPublicClient: PublicClient<Transport, TChain>,
  { rollup }: { rollup: Address },
): Promise<ArbitrumNetwork> {
  const rollupInitializedEvent = await getRollupInitializedEvents({
    rollup,
    publicClient: parentChainPublicClient,
  });

  // Fetch orbit chain chainId
  const { chainId } = rollupInitializedEvent[0].args;

  if (!chainId) {
    throw new Error("RollupInitialized event doesn't contain chainId");
  }

  const { parentChainId, ethBridge, confirmPeriodBlocks, nativeToken } =
    await getArbitrumNetworkInformationFromRollup(
      rollup,
      publicClientToProvider(parentChainPublicClient),
    );

  const { parentChainContracts, orbitChainContracts } =
    await createTokenBridgeFetchTokenBridgeContracts({
      inbox: ethBridge.inbox as Address,
      parentChainPublicClient,
    });

  return {
    name: String(`${chainId}-arbitrum-network`),
    chainId: Number(chainId),
    parentChainId,
    confirmPeriodBlocks,
    ethBridge,
    isCustom: true,
    isTestnet: isTestnet(parentChainId),
    nativeToken,
    tokenBridge: {
      parentGatewayRouter: parentChainContracts.router,
      parentErc20Gateway: parentChainContracts.standardGateway,
      parentCustomGateway: parentChainContracts.customGateway,
      parentWeth: parentChainContracts.weth,
      parentWethGateway: parentChainContracts.wethGateway,
      parentMultiCall: parentChainContracts.multicall,

      childGatewayRouter: orbitChainContracts.router,
      childErc20Gateway: orbitChainContracts.standardGateway,
      childCustomGateway: orbitChainContracts.customGateway,
      childWeth: orbitChainContracts.weth,
      childWethGateway: orbitChainContracts.wethGateway,
      childMultiCall: orbitChainContracts.multicall,
    },
  } satisfies ArbitrumNetwork;
}

export const registerNewNetwork = async (
  parentProvider: JsonRpcProvider,
  childProvider: JsonRpcProvider,
  rollupAddress: string,
): Promise<ArbitrumNetwork> => {
  const chainId = (await childProvider.getNetwork()).chainId;
  const { parentChainId, ethBridge, confirmPeriodBlocks } =
    await getArbitrumNetworkInformationFromRollup(rollupAddress, parentProvider);

  const arbitrumNetwork: ArbitrumNetwork = {
    name: String(`${chainId}-arbitrum-network`),
    chainId,
    parentChainId,
    confirmPeriodBlocks,
    ethBridge,
    isCustom: true,
    isTestnet: isTestnet(parentChainId),
  };

  return registerCustomArbitrumNetwork(arbitrumNetwork);
};
