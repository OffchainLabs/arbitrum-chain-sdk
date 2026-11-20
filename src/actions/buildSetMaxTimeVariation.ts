import { Chain, PublicClient, Transport } from 'viem';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
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
  delayBlocks: bigint;
  futureBlocks: bigint;
  delaySeconds: bigint;
  futureSeconds: bigint;
};
export type BuildSetMaxTimeVariationParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<WithAccount<ActionParameters<Args, 'sequencerInbox', Curried>>>
>;

export type BuildSetMaxTimeVariationReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetMaxTimeVariation<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  {
    account,
    upgradeExecutor,
    sequencerInbox: sequencerInboxAddress,
    params,
  }: BuildSetMaxTimeVariationParameters,
): Promise<BuildSetMaxTimeVariationReturnType> {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest(client, {
    chainId,
    account,
    to: sequencerInboxAddress,
    upgradeExecutor,
    args: [params],
    abi: sequencerInboxABI,
    functionName: 'setMaxTimeVariation',
  });
}
