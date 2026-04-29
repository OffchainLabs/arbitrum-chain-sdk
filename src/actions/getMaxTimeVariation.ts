import { Chain, PublicClient, Transport } from 'viem';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
import { ActionParameters } from '../types/Actions';

export type GetMaxTimeVariationParameters<Curried extends boolean = false> = ActionParameters<
  Record<string, never>,
  'sequencerInbox',
  Curried
>;

export type GetMaxTimeVariationReturnType = {
  delayBlocks: bigint;
  futureBlocks: bigint;
  delaySeconds: bigint;
  futureSeconds: bigint;
};

export async function getMaxTimeVariation<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { sequencerInbox }: GetMaxTimeVariationParameters,
): Promise<GetMaxTimeVariationReturnType> {
  const [delayBlocks, futureBlocks, delaySeconds, futureSeconds] = await client.readContract({
    abi: sequencerInboxABI,
    functionName: 'maxTimeVariation',
    address: sequencerInbox,
  });
  return {
    delayBlocks,
    futureBlocks,
    delaySeconds,
    futureSeconds,
  };
}
