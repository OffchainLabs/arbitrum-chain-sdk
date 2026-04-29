/**
 * Bridge UI configuration information for adding a new test arbitrum chain
 */
export type BridgeUiConfig = {
  /**
   * Basic chain information
   */
  chainInfo: {
    chainName: string;
    chainId: number;
    parentChainId: number;
    rpcUrl: string;
    explorerUrl: string;
    nativeToken?: string;
  };
  /**
   * Core protocol contract addresses
   */
  coreContracts: {
    rollup: string;
    inbox: string;
    outbox: string;
    sequencerInbox: string;
    bridge: string;
    nativeToken?: string;
  };
  /**
   * Token bridge contract addresses for both parent chain (L2) and Orbit chain (L3)
   */
  tokenBridgeContracts: {
    /** Parent chain (L2) contract addresses */
    l2Contracts: {
      customGateway: string;
      multicall: string;
      proxyAdmin: string;
      router: string;
      standardGateway: string;
      weth: string;
      wethGateway: string;
    };
    /** Orbit chain (L3) contract addresses */
    l3Contracts: {
      customGateway: string;
      multicall: string;
      proxyAdmin: string;
      router: string;
      standardGateway: string;
      weth: string;
      wethGateway: string;
    };
  };
};
