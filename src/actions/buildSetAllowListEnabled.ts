import { Chain, PublicClient, Transport } from 'viem';
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
  enabled: boolean;
};

export type BuildSetAllowListEnabledParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<WithAccount<ActionParameters<Args, 'inbox', Curried>>>
>;

export type BuildSetAllowListEnabledReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetAllowListEnabled<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, inbox: inboxAddress, params }: BuildSetAllowListEnabledParameters,
): Promise<BuildSetAllowListEnabledReturnType> {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest(client, {
    chainId,
    account,
    to: inboxAddress,
    upgradeExecutor,
    args: [params.enabled],
    abi: inboxABI,
    functionName: 'setAllowListEnabled',
  });
}
