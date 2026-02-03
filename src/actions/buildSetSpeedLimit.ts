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

export type BuildSetSpeedLimitParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: { limit: bigint };
    }>
  >
>;

export type BuildSetSpeedLimitReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetSpeedLimit<TChain extends Chain | undefined>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildSetSpeedLimitParameters,
): Promise<BuildSetSpeedLimitReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.limit],
      abi: arbOwnerABI,
      functionName: 'setSpeedLimit',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
