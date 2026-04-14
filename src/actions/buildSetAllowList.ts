import { Address, Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { absInboxABI } from '../contracts/AbsInbox';
import {
  ActionParameters,
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';
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

  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: inboxAddress,
      upgradeExecutor,
      args: [params.addresses, params.allowed],
      abi: absInboxABI,
      functionName: 'setAllowList',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId };
}
