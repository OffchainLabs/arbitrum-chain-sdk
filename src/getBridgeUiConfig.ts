import { createPublicClient, PublicClient, Chain, Transport, http } from 'viem';

import { ChainConfig } from './types/ChainConfig';
import { BridgeUiConfig } from './types/BridgeUiConfig';
import { createRollupPrepareTransaction } from './createRollupPrepareTransaction';
import { createRollupPrepareTransactionReceipt } from './createRollupPrepareTransactionReceipt';
import { createTokenBridgeFetchTokenBridgeContracts } from './createTokenBridgeFetchTokenBridgeContracts';

/**
 * Parameters for retrieving bridge UI configuration
 */
export type GetBridgeUiConfigFunctionParams<TChain extends Chain> = {
  /**
   * Configuration parameters
   */
  params: {
    parentChain: TChain;
    deploymentTxHash: `0x${string}`;
    chainName?: string;
    rpcUrl?: string;
    explorerUrl?: string;
  };
  parentChainPublicClient?: PublicClient<Transport, TChain>;
};

/**
 * Retrieves the bridge UI configuration for an Orbit chain.
 *
 * This function fetches all necessary contract addresses and metadata
 * required for adding a new test arbitrum chain to the bridge UI.
 *
 * Accepts arbitrum chain deployment config, parent chain, and the parent chain public client.
 *
 * Returns the bridge UI configuration object.
 *
 * @param {Object} GetBridgeUiConfigFunctionParams - Parameters for fetching bridge UI config
 * @param {Object} GetBridgeUiConfigFunctionParams.params - Configuration parameters
 * @param {Object} GetBridgeUiConfigFunctionParams.params.parentChain - The parent chain object (e.g., arbitrumSepolia)
 * @param {string} GetBridgeUiConfigFunctionParams.params.deploymentTxHash - The transaction hash of the Orbit chain deployment
 * @param {string} [GetBridgeUiConfigFunctionParams.params.chainName] - Optional, the name of the Orbit chain
 * @param {string} [GetBridgeUiConfigFunctionParams.params.rpcUrl] - Optional, the RPC URL for the Orbit chain
 * @param {string} [GetBridgeUiConfigFunctionParams.params.explorerUrl] - Optional, the block explorer URL for the Orbit chain
 * @param {Object} [GetBridgeUiConfigFunctionParams.parentChainPublicClient] - Optional, a Viem PublicClient instance for the parent chain
 *
 * @returns {Promise<BridgeUiConfig>} - The bridge UI configuration object
 *
 * @example
 * const bridgeUiInfo = await getBridgeUiConfig({
 *   params: {
 *     parentChain,
 *     deploymentTxHash: '0x...',
 *     chainName: 'My Orbit Chain',
 *     rpcUrl: 'http://localhost:8449',
 *     explorerUrl: 'http://localhost:4000',
 *   },
 *   parentChainPublicClient,
 * });
 */
export async function getBridgeUiConfig<TChain extends Chain>({
  params,
  parentChainPublicClient: providedClient,
}: GetBridgeUiConfigFunctionParams<TChain>): Promise<BridgeUiConfig> {
  const { parentChain, deploymentTxHash, chainName, rpcUrl, explorerUrl } = params;

  // Create a new public client if not provided
  const parentChainPublicClient: PublicClient<Transport, TChain> =
    providedClient ?? createPublicClient({ chain: parentChain, transport: http() });

  const txData = await parentChainPublicClient.getTransaction({ hash: deploymentTxHash });
  // Get the deployment transaction
  const tx = createRollupPrepareTransaction(txData);

  // Extract chain configuration from transaction inputs
  const config = tx.getInputs()[0].config;
  const chainConfig: ChainConfig = JSON.parse(config.chainConfig);

  // Get the transaction receipt
  const txReceiptData = await parentChainPublicClient.getTransactionReceipt({
    hash: deploymentTxHash,
  });
  const txReceipt = createRollupPrepareTransactionReceipt(txReceiptData);

  // Get core contract addresses
  const coreContracts = txReceipt.getCoreContracts();

  // Get token bridge contract addresses
  const tokenBridgeContracts = await createTokenBridgeFetchTokenBridgeContracts({
    inbox: coreContracts.inbox,
    parentChainPublicClient,
  });

  // Build and return the configuration object
  return {
    chainInfo: {
      chainName: chainName || 'My Orbit Chain',
      chainId: chainConfig.chainId,
      parentChainId: parentChain.id,
      rpcUrl: rpcUrl || 'http://localhost:8449',
      explorerUrl: explorerUrl || 'http://localhost:4000',
      nativeToken: coreContracts.nativeToken,
    },
    coreContracts: {
      rollup: coreContracts.rollup,
      inbox: coreContracts.inbox,
      outbox: coreContracts.outbox,
      sequencerInbox: coreContracts.sequencerInbox,
      bridge: coreContracts.bridge,
      nativeToken: coreContracts.nativeToken,
    },
    tokenBridgeContracts: {
      l2Contracts: {
        customGateway: tokenBridgeContracts.parentChainContracts.customGateway,
        multicall: tokenBridgeContracts.parentChainContracts.multicall,
        proxyAdmin: tokenBridgeContracts.orbitChainContracts.proxyAdmin,
        router: tokenBridgeContracts.parentChainContracts.router,
        standardGateway: tokenBridgeContracts.parentChainContracts.standardGateway,
        weth: tokenBridgeContracts.parentChainContracts.weth,
        wethGateway: tokenBridgeContracts.parentChainContracts.wethGateway,
      },
      l3Contracts: {
        customGateway: tokenBridgeContracts.orbitChainContracts.customGateway,
        multicall: tokenBridgeContracts.orbitChainContracts.multicall,
        proxyAdmin: tokenBridgeContracts.orbitChainContracts.proxyAdmin,
        router: tokenBridgeContracts.orbitChainContracts.router,
        standardGateway: tokenBridgeContracts.orbitChainContracts.standardGateway,
        weth: tokenBridgeContracts.orbitChainContracts.weth,
        wethGateway: tokenBridgeContracts.orbitChainContracts.wethGateway,
      },
    },
  };
}
