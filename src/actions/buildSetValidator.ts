import { Address, Chain, PrepareTransactionRequestParameters, PublicClient, Transport } from 'viem';
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

export type BuildSetIsValidatorParameters<Curried extends boolean = false> = Prettify<
  WithUpgradeExecutor<
    WithAccount<
      ActionParameters<
        {
          add: Address[];
          remove: Address[];
        },
        'rollupAdminLogic',
        Curried
      >
    >
  >
>;

export type BuildSetIsValidatorReturnType = PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetValidators<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { account, upgradeExecutor, params, ...args }: BuildSetIsValidatorParameters,
): Promise<BuildSetIsValidatorReturnType> {
  const validatedPublicClient = validateParentChainPublicClient(client);
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;
  const { add: addressesToAdd, remove: addressesToRemove } = params;

  const addState: boolean[] = new Array(addressesToAdd.length).fill(true);
  const removeState: boolean[] = new Array(addressesToRemove.length).fill(false);

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: rollupAdminLogicAddress,
      upgradeExecutor,
      args: [addressesToAdd.concat(addressesToRemove), addState.concat(removeState)],
      abi: rollupABI,
      functionName: 'setValidator',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}
