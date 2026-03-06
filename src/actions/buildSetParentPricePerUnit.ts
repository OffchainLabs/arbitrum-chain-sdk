import { Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { arbOwnerABI, arbOwnerAddress } from '../contracts/ArbOwner';
import {
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';
import { validateChildChainPublicClient } from '../types/validateChildChainPublicClient';

export type BuildSetParentPricePerUnitParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: { pricePerUnit: bigint };
    }>
  >
>;

export type BuildSetParentPricePerUnitReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetParentPricePerUnit<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildSetParentPricePerUnitParameters,
): Promise<BuildSetParentPricePerUnitReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: validatedPublicClient.chain,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.pricePerUnit],
      abi: arbOwnerABI,
      functionName: 'setL1PricePerUnit',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
