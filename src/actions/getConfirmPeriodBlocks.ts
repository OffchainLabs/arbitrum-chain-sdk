import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { rollupABI } from '../contracts/Rollup';
import { WithContractAddress } from '../types/Actions';
import { getRollupAddress } from '../getRollupAddress';

export type GetConfirmPeriodBlocksParameters<Curried extends boolean = false> = WithContractAddress<
  {},
  'rollupAdminLogic',
  Curried
>;

export type GetConfirmPeriodBlocksReturnType = ReadContractReturnType<
  typeof rollupABI,
  'confirmPeriodBlocks'
>;

export async function getConfirmPeriodBlocks<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: GetConfirmPeriodBlocksParameters,
): Promise<GetConfirmPeriodBlocksReturnType> {
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;

  return client.readContract({
    abi: rollupABI,
    functionName: 'confirmPeriodBlocks',
    address: rollupAdminLogicAddress,
  });
}
