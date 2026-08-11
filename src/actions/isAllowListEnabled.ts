import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { inboxABI } from '../contracts/Inbox';
import { ActionParameters } from '../types/Actions';

export type IsAllowListEnabledParameters<Curried extends boolean = false> = ActionParameters<
  Record<string, never>,
  'inbox',
  Curried
>;

export type IsAllowListEnabledReturnType = ReadContractReturnType<
  typeof inboxABI,
  'allowListEnabled'
>;

export async function isAllowListEnabled<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { inbox }: IsAllowListEnabledParameters,
): Promise<IsAllowListEnabledReturnType> {
  return client.readContract({
    abi: inboxABI,
    functionName: 'allowListEnabled',
    address: inbox,
  });
}
