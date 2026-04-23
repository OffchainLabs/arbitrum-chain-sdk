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

export type BuildSetValidatorWhitelistDisabledParameters<Curried extends boolean = false> =
  Prettify<WithUpgradeExecutor<WithAccount<ActionParameters<{}, 'rollupAdminLogic', Curried>>>>;

export type BuildSetValidatorWhitelistDisabledReturnType =
  PrepareTransactionRequestReturnTypeWithChainId;

export async function buildSetValidatorWhitelistDisabled<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  {
    account,
    upgradeExecutor,
    params,
    ...args
  }: BuildSetValidatorWhitelistDisabledParameters & { params: { enable: boolean } },
): Promise<BuildSetValidatorWhitelistDisabledReturnType> {
  const validatedPublicClient = validateParentChainPublicClient(client);
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;

  const request = await client.prepareTransactionRequest({
    chain: client.chain as Chain | undefined,
    account,
    ...prepareUpgradeExecutorCallParameters({
      to: rollupAdminLogicAddress,
      upgradeExecutor,
      args: [params.enable],
      abi: rollupABI,
      functionName: 'setValidatorWhitelistDisabled',
    }),
  } satisfies PrepareTransactionRequestParameters);

  return { ...request, chainId: validatedPublicClient.chain.id };
}

export async function buildEnableValidatorWhitelist<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: BuildSetValidatorWhitelistDisabledParameters,
): Promise<BuildSetValidatorWhitelistDisabledReturnType> {
  return buildSetValidatorWhitelistDisabled(client, {
    ...args,
    params: {
      enable: true,
    },
  });
}

export async function buildDisableValidatorWhitelist<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: BuildSetValidatorWhitelistDisabledParameters,
): Promise<BuildSetValidatorWhitelistDisabledReturnType> {
  return buildSetValidatorWhitelistDisabled(client, {
    ...args,
    params: {
      enable: false,
    },
  });
}
