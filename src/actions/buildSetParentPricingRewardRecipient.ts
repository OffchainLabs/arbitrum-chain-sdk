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

export type BuildSetParentPricingRewardRecipientParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: { recipient: Address };
    }>
  >
>;

export type BuildSetParentPricingRewardRecipientReturnType =
  PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetParentPricingRewardRecipient<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildSetParentPricingRewardRecipientParameters,
): Promise<BuildSetParentPricingRewardRecipientReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.recipient],
      abi: arbOwnerABI,
      functionName: 'setL1PricingRewardRecipient',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
