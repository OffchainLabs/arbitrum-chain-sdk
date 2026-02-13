import { Address, Chain, PublicClient, Transport } from 'viem';
import { sequencerInboxABI } from './contracts/SequencerInbox';

const cache: Record<string, Address> = {};
export async function getRollupAddress<TChain extends Chain>(
  publicClient: PublicClient<Transport, TChain>,
  params: { sequencerInbox: Address },
): Promise<Address> {
  const addressFromCache = cache[`${publicClient.chain.id}_${params.sequencerInbox}`];
  if (addressFromCache) {
    return addressFromCache;
  }

  // Otherwise, fetch the rollup address from sequencerInbox contract
  const rollupAddress = await publicClient.readContract({
    functionName: 'rollup',
    address: params.sequencerInbox,
    abi: sequencerInboxABI,
  });
  cache[`${publicClient.chain.id}_${params.sequencerInbox}`] = rollupAddress;
  return rollupAddress;
}
