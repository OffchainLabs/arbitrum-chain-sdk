import { Chain, Hex, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
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

export type BuildSetWasmModuleRootParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<
    WithAccount<
      ActionParameters<
        {
          newWasmModuleRoot: Hex;
        },
        'rollupAdminLogic',
        Curried
      >
    >
  >
>;

export type BuildSetWasmModuleRootReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetWasmModuleRoot<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params, ...args }: BuildSetWasmModuleRootParameters,
): Promise<BuildSetWasmModuleRootReturnType> {
  const validatedPublicClient = validateParentChainPublicClient(client);
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: rollupAdminLogicAddress,
      upgradeExecutor,
      args: [params.newWasmModuleRoot],
      abi: rollupABI,
      functionName: 'setWasmModuleRoot',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
