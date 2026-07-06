import { Chain, Hex, PublicClient, Transport } from 'viem';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
import {
  ActionParameters,
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { validateParentChain } from '../types/ParentChain';
import { prepareContractTransactionRequest } from '../contractTransactionRequests';

export type BuildSetValidKeysetParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<
    WithAccount<
      ActionParameters<
        {
          keyset: Hex;
        },
        'sequencerInbox',
        Curried
      >
    >
  >
>;

export type BuildSetValidKeysetReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetValidKeyset<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  {
    account,
    upgradeExecutor,
    sequencerInbox: sequencerInboxAddress,
    params,
  }: BuildSetValidKeysetParameters,
): Promise<BuildSetValidKeysetReturnType> {
  const { chainId } = validateParentChain(client);

  return prepareContractTransactionRequest(client, {
    chainId,
    account,
    to: sequencerInboxAddress,
    upgradeExecutor,
    args: [params.keyset],
    abi: sequencerInboxABI,
    functionName: 'setValidKeyset',
  });
}
