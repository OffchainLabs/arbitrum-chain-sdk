import { Address, Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { absInboxABI } from '../contracts/AbsInbox';
import { ActionParameters } from '../types/Actions';

type Args = {
  address: Address;
};

export type IsAllowedParameters<Curried extends boolean = false> = ActionParameters<
  Args,
  'inbox',
  Curried
>;

export type IsAllowedReturnType = ReadContractReturnType<typeof absInboxABI, 'isAllowed'>;

export async function isAllowed<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { inbox, params }: IsAllowedParameters,
): Promise<IsAllowedReturnType> {
  return client.readContract({
    abi: absInboxABI,
    functionName: 'isAllowed',
    address: inbox,
    args: [params.address],
  });
}
