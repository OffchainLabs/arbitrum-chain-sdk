import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { absInboxABI } from '../contracts/AbsInbox';
import { ActionParameters } from '../types/Actions';

export type IsAllowListEnabledParameters<Curried extends boolean = false> = ActionParameters<
  Record<string, never>,
  'inbox',
  Curried
>;

export type IsAllowListEnabledReturnType = ReadContractReturnType<
  typeof absInboxABI,
  'allowListEnabled'
>;

export async function isAllowListEnabled<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { inbox }: IsAllowListEnabledParameters,
): Promise<IsAllowListEnabledReturnType> {
  return client.readContract({
    abi: absInboxABI,
    functionName: 'allowListEnabled',
    address: inbox,
  });
}
