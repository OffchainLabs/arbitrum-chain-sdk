import { Address, Chain } from 'viem';

import { validateParentChain } from './types/ParentChain';
import { SetValidKeysetParams } from './setValidKeyset';
import { setValidKeysetEncodeFunctionData } from './setValidKeysetEncodeFunctionData';
import { upgradeExecutorEncodeFunctionData } from './upgradeExecutorEncodeFunctionData';

export type SetValidKeysetPrepareTransactionRequestParams<TChain extends Chain | undefined> = Omit<
  SetValidKeysetParams<TChain>,
  'walletClient'
> & {
  account: Address;
};

export async function setValidKeysetPrepareTransactionRequest<TChain extends Chain | undefined>({
  coreContracts,
  keyset,
  account,
  publicClient,
}: SetValidKeysetPrepareTransactionRequestParams<TChain>) {
  const { chainId } = validateParentChain(publicClient);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await publicClient.prepareTransactionRequest({
    chain: publicClient.chain,
    to: coreContracts.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [
        coreContracts.sequencerInbox, // target
        setValidKeysetEncodeFunctionData(keyset), // targetCallData
      ],
    }),
    account,
  });

  return { ...request, chainId };
}
