import { Chain, fallback, http } from 'viem';
import { arbitrum, arbitrumSepolia, sepolia } from 'viem/chains';

const rpcUrls: Partial<Record<number, readonly string[]>> = {
  [sepolia.id]: [
    'https://sepolia.rpc.sentio.xyz',
    'https://sepolia.gateway.tenderly.co',
    'https://11155111.rpc.thirdweb.com',
  ],
  [arbitrumSepolia.id]: [
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://arbitrum-sepolia-rpc.publicnode.com',
  ],
  [arbitrum.id]: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'],
};

/** Public RPC failover for tests that read live chains. */
export function createTestRpcTransport(chain: Chain) {
  const urls = rpcUrls[chain.id] ?? chain.rpcUrls.default.http;
  return fallback(
    urls.map((url) => http(url, { timeout: 5_000, retryCount: 1 })),
    { retryCount: 0 },
  );
}
