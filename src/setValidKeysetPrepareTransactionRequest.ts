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
  if (publicClient.chain === undefined) {
    throw new Error('[setValidKeysetPrepareTransactionRequest] publicClient.chain is undefined');
  }
  const chain: Chain = publicClient.chain;

  const request = await publicClient.prepareTransactionRequest({
    chain,
    type: 'eip1559',
    to: coreContracts.upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: 'executeCall',
      args: [coreContracts.sequencerInbox, setValidKeysetEncodeFunctionData(keyset)],
    }),
    account,
  });

  return { ...request, chainId };
}
