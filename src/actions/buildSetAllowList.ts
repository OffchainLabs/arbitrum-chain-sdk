import { Address, Chain, PublicClient, Transport } from 'viem';
import { inboxABI } from '../contracts/Inbox';
import {
  ActionParameters,
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { prepareContractTransactionRequest } from '../contractTransactionRequests';
import { validateParentChain } from '../types/ParentChain';

type Args = {
  addresses: Address[];
  allowed: boolean[];
};

export type BuildSetAllowListParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<WithAccount<ActionParameters<Args, 'inbox', Curried>>>
>;

export type BuildSetAllowListReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetAllowList<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, inbox: inboxAddress, params }: BuildSetAllowListParameters,
): Promise<BuildSetAllowListReturnType> {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest(client, {
    chainId,
    account,
    to: inboxAddress,
    upgradeExecutor,
    args: [params.addresses, params.allowed],
    abi: inboxABI,
    functionName: 'setAllowList',
  });
}
