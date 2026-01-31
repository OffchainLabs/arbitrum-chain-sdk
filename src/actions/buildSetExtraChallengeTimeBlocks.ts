import { Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
import { rollupABI } from '../contracts/Rollup';
import {
  WithAccount,
  ActionParameters,
  WithUpgradeExecutor,
  PrepareTransactionRequestReturnTypeWithChainId,
} from '../types/Actions';
import { Prettify } from '../types/utils';
import { getRollupAddress } from '../getRollupAddress';
import { validateParentChainPublicClient } from '../types/ParentChain';
import { prepareUpgradeExecutorCallParameters } from '../prepareUpgradeExecutorCallParameters';

export type BuildSetExtraChallengeTimeBlocksParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<
    WithAccount<ActionParameters<{ newExtraTimeBlocks: bigint }, 'rollupAdminLogic', Curried>>
  >
>;

export type BuildSetExtraChallengeTimeBlocksReturnType =
  PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetExtraChallengeTimeBlocks<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { params, account, upgradeExecutor, ...args }: BuildSetExtraChallengeTimeBlocksParameters,
): Promise<BuildSetExtraChallengeTimeBlocksReturnType> {
  const validatedPublicClient = validateParentChainPublicClient(client);
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: rollupAdminLogicAddress,
      upgradeExecutor,
      args: [params.newExtraTimeBlocks],
      abi: rollupABI,
      functionName: 'setExtraChallengeTimeBlocks',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
