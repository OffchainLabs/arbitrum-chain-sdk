import { Chain, Hex, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { sequencerInboxABI } from '../contracts/SequencerInbox';
import {
  ActionParameters,
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { validateParentChain } from '../types/ParentChain';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';

export type BuildInvalidateKeysetHashParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<
    WithAccount<
      ActionParameters<
        {
          keysetHash: Hex;
        },
        'sequencerInbox',
        Curried
      >
    >
  >
>;

export type BuildInvalidateKeysetHashReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildInvalidateKeysetHash<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  {
    account,
    upgradeExecutor,
    sequencerInbox: sequencerInboxAddress,
    params,
  }: BuildInvalidateKeysetHashParameters,
): Promise<BuildInvalidateKeysetHashReturnType> {
  const { chainId } = validateParentChain(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: sequencerInboxAddress,
      upgradeExecutor,
      args: [params.keysetHash],
      abi: sequencerInboxABI,
      functionName: 'invalidateKeysetHash',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId };
}
