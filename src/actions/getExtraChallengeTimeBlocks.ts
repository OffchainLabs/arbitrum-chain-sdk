import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { rollupABI } from '../contracts/Rollup';
import { WithContractAddress } from '../types/Actions';
import { getRollupAddress } from '../getRollupAddress';

export type GetExtraChallengeTimeBlocksParameters<Curried extends boolean = false> =
  WithContractAddress<{}, 'rollupAdminLogic', Curried>;

export type GetExtraChallengeTimeBlocksReturnType = ReadContractReturnType<
  typeof rollupABI,
  'extraChallengeTimeBlocks'
>;

export async function getExtraChallengeTimeBlocks<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: GetExtraChallengeTimeBlocksParameters,
): Promise<GetExtraChallengeTimeBlocksReturnType> {
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;
  return client.readContract({
    abi: rollupABI,
    functionName: 'extraChallengeTimeBlocks',
    address: rollupAdminLogicAddress,
  });
}
