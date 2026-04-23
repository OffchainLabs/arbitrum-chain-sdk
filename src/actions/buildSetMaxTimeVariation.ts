import {
  Chain,
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
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';
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
  if (client.chain === undefined) {
    throw new Error('[buildSetMaxTimeVariation] client.chain is undefined');
  }
  const chain: Chain = client.chain;

  const encoded = encodeFunctionData({
    abi: sequencerInboxABI,
    functionName: 'setMaxTimeVariation',
    args: [params],
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
