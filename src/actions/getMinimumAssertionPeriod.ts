import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { rollupABI } from '../contracts/Rollup';
import { WithContractAddress } from '../types/Actions';
import { getRollupAddress } from '../getRollupAddress';

export type GetMinimumAssertionPeriodParameters<Curried extends boolean = false> =
  WithContractAddress<{}, 'rollupAdminLogic', Curried>;

export type GetMinimumAssertionPeriodReturnType = ReadContractReturnType<
  typeof rollupABI,
  'minimumAssertionPeriod'
>;

export async function getMinimumAssertionPeriod<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: GetMinimumAssertionPeriodParameters,
): Promise<GetMinimumAssertionPeriodReturnType> {
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;
  return client.readContract({
    abi: rollupABI,
    functionName: 'minimumAssertionPeriod',
    address: rollupAdminLogicAddress,
  });
}
