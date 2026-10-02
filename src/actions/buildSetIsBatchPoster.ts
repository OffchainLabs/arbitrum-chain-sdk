import { Address, Chain, PublicClient, Transport } from 'viem';
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
  batchPoster: Address;
};

export type BuildSetIsBatchPosterParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<WithAccount<ActionParameters<Args, 'sequencerInbox', Curried>>>
>;

export type BuildSetIsBatchPosterReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetIsBatchPoster<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  {
    account,
    upgradeExecutor,
    sequencerInbox: sequencerInboxAddress,
    params,
  }: BuildSetIsBatchPosterParameters & { params: { enable: boolean } },
): Promise<BuildSetIsBatchPosterReturnType> {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest(client, {
    chainId,
    account,
    to: sequencerInboxAddress,
    upgradeExecutor,
    args: [params.batchPoster, params.enable],
    abi: sequencerInboxABI,
    functionName: 'setIsBatchPoster',
  });
}

export async function buildEnableBatchPoster<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  args: BuildSetIsBatchPosterParameters,
): Promise<BuildSetIsBatchPosterReturnType> {
  return buildSetIsBatchPoster(client, {
    ...args,
    params: {
      ...args.params,
      enable: true,
    },
  });
}

export async function buildDisableBatchPoster<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  args: BuildSetIsBatchPosterParameters,
): Promise<BuildSetIsBatchPosterReturnType> {
  return buildSetIsBatchPoster(client, {
    ...args,
    params: {
      ...args.params,
      enable: false,
    },
  });
}
