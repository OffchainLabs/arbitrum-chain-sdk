import { Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { rollupABI } from '../contracts/Rollup';
import {
  WithAccount,
  ActionParameters,
  PrepareTransactionRequestReturnTypeWithChainId,
  WithUpgradeExecutor,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { getRollupAddress } from '../getRollupAddress';
import { validateParentChainPublicClient } from '../types/ParentChain';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';

export type BuildSetMinimumAssertionPeriodParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<
    WithAccount<ActionParameters<{ newPeriod: bigint }, 'rollupAdminLogic', Curried>>
  >
>;

export type BuildSetMinimumAssertionPeriodReturnType =
  PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetMinimumAssertionPeriod<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { params, account, upgradeExecutor, ...args }: BuildSetMinimumAssertionPeriodParameters,
): Promise<BuildSetMinimumAssertionPeriodReturnType> {
  const validatedPublicClient = validateParentChainPublicClient(client);
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: rollupAdminLogicAddress,
      upgradeExecutor,
      args: [params.newPeriod],
      abi: rollupABI,
      functionName: 'setMinimumAssertionPeriod',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
