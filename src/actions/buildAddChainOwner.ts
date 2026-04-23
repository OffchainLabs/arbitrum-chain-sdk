import { Address, Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { arbOwnerABI, arbOwnerAddress } from '../contracts/ArbOwner';
import {
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';
import { validateChildChainPublicClient } from '../types/validateChildChainPublicClient';

export type BuildAddChainOwnerParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: {
        newOwner: Address;
      };
    }>
  >
>;
export type BuildAddChainOwnerReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildAddChainOwner<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildAddChainOwnerParameters,
): Promise<BuildAddChainOwnerReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.newOwner],
      abi: arbOwnerABI,
      functionName: 'addChainOwner',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
