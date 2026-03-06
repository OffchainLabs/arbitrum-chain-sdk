import { Chain, PublicClient, Transport } from 'viem';
import { Prettify } from './utils';

export type ChildChainPublicClient<TChain extends Chain | undefined> = Prettify<
  PublicClient<Transport, TChain> & { chain: NonNullable<TChain> }
>;

export function validateChildChainPublicClient<TChain extends Chain | undefined>(
  publicClient: PublicClient<Transport, TChain>,
): ChildChainPublicClient<TChain> {
  if (!publicClient.chain) {
    throw new Error('client.chain is undefined');
  }

  return publicClient as ChildChainPublicClient<TChain>;
}
