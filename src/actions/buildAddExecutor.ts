import { Address, Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { upgradeExecutorABI } from '../contracts/UpgradeExecutor';
import {
  ActionParameters,
  PrepareTransactionRequestReturnTypeWithChainId,
  WithAccount,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { UPGRADE_EXECUTOR_ROLE_EXECUTOR } from '../upgradeExecutorEncodeFunctionData';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';

export type BuildAddExecutorParameters<Curried extends boolean = false> = Prettify<
  WithAccount<
    ActionParameters<
      {
        address: Address;
      },
      'upgradeExecutor',
      Curried
    >
  >
>;

export type BuildAddExecutorReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildAddExecutor<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor: upgradeExecutorAddress, params }: BuildAddExecutorParameters,
): Promise<BuildAddExecutorReturnType> {
  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: upgradeExecutorAddress,
      upgradeExecutor: upgradeExecutorAddress,
      args: [UPGRADE_EXECUTOR_ROLE_EXECUTOR, params.address],
      abi: upgradeExecutorABI,
      functionName: 'grantRole',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: client.chain.id };
}
