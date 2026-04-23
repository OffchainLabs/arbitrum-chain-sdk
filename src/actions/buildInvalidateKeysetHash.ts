import {
  Chain,
  Hex,
  PrepareTransactionRequestParameters,
  PublicClient,
  Transport,
  encodeFunctionData,
} from 'viem';
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
  if (client.chain === undefined) {
    throw new Error('[buildInvalidateKeysetHash] client.chain is undefined');
  }
  const chain: Chain = client.chain;

  const encoded = encodeFunctionData({
    abi: sequencerInboxABI,
    functionName: 'invalidateKeysetHash',
    args: [params.keysetHash],
  });
  const request = await client.prepareTransactionRequest({
    chain,
    account,
    type: 'eip1559',
    ...prepareUpgradeExecutorCallParameters(encoded, {
      to: sequencerInboxAddress,
      upgradeExecutor,
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId };
}
