import { Address, Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { inboxABI } from '../contracts/Inbox';
import { ActionParameters } from '../types/Actions';

type Args = {
  address: Address;
};

export type IsAllowedParameters<Curried extends boolean = false> = ActionParameters<
  Args,
  'inbox',
  Curried
>;

export type IsAllowedReturnType = ReadContractReturnType<typeof inboxABI, 'isAllowed'>;

export async function isAllowed<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { inbox, params }: IsAllowedParameters,
): Promise<IsAllowedReturnType> {
  return client.readContract({
    abi: inboxABI,
    functionName: 'isAllowed',
    address: inbox,
    args: [params.address],
  });
}
