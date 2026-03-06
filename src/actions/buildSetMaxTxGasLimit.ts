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

export type BuildSetMaxTxGasLimitParameters = Prettify<
  WithUpgradeExecutor<
    WithAccount<{
      params: { limit: bigint };
    }>
  >
>;

export type BuildSetMaxTxGasLimitReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetMaxTxGasLimit<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params }: BuildSetMaxTxGasLimitParameters,
): Promise<BuildSetMaxTxGasLimitReturnType> {
  const validatedPublicClient = validateChildChainPublicClient(client);

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: arbOwnerAddress,
      upgradeExecutor,
      args: [params.limit],
      abi: arbOwnerABI,
      functionName: 'setMaxTxGasLimit',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
