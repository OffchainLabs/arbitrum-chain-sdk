import { Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { arbOwnerABI, arbOwnerAddress } from '../contracts/ArbOwner';
import {
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { validateChildChainPublicClient } from '../types/validateChildChainPublicClient';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';

export type BuildSetParentPricingRewardRateParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: { weiPerUnit: bigint };
    }>
  >
>;

export type BuildSetParentPricingRewardRateReturnType =
  PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetParentPricingRewardRate<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildSetParentPricingRewardRateParameters,
): Promise<BuildSetParentPricingRewardRateReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.weiPerUnit],
      abi: arbOwnerABI,
      functionName: 'setL1PricingRewardRate',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
