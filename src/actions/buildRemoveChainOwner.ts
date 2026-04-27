import { Address, Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { arbOwnerABI, arbOwnerAddress } from '../contracts/ArbOwner';
import {
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { validateChildChainPublicClient } from '../types/validateChildChainPublicClient';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';

export type BuildRemoveChainOwnerParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: { owner: Address };
    }>
  >
>;

export type BuildRemoveChainOwnerReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildRemoveChainOwner<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildRemoveChainOwnerParameters,
): Promise<BuildRemoveChainOwnerReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.owner],
      abi: arbOwnerABI,
      functionName: 'removeChainOwner',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
