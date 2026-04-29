import { Chain, Client, Transport } from 'viem';

export function assertChainId<TChain extends Chain | undefined>(
  client: Client<Transport, TChain>,
): number {
  const chainId = client.chain?.id;

  if (!chainId) {
    throw new Error('Missing chain for publicClient');
  }

  return chainId;
}
