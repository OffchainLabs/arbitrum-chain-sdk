import { z } from 'zod';
import { PublicClient, Transport, Chain, WalletClient } from 'viem';
import { coreContractsSchema, hexSchema } from './schemas/primitives';

import { upgradeExecutorABI } from './contracts/UpgradeExecutor';
import { validateParentChain } from './types/ParentChain';
import { CoreContracts } from './types/CoreContracts';
import { setValidKeysetEncodeFunctionData } from './setValidKeysetEncodeFunctionData';

export type SetValidKeysetParams<TChain extends Chain | undefined> = {
  coreContracts: Pick<CoreContracts, 'upgradeExecutor' | 'sequencerInbox'>;
  keyset: `0x${string}`;
  publicClient: PublicClient<Transport, TChain>;
  walletClient: WalletClient;
};

export const setValidKeysetParams = z.object({
  coreContracts: coreContractsSchema.pick({ upgradeExecutor: true, sequencerInbox: true }),
  keyset: hexSchema,
});

export async function setValidKeyset<TChain extends Chain | undefined>({
  coreContracts,
  keyset,
  publicClient,
  walletClient,
}: SetValidKeysetParams<TChain>) {
  setValidKeysetParams.parse({ coreContracts, keyset });
  validateParentChain(publicClient);
  const account = walletClient.account?.address;

  if (typeof account === 'undefined') {
    throw new Error('account is undefined');
  }

  // @ts-expect-error -- todo: fix viem type issue
  const { request } = await publicClient.simulateContract({
    address: coreContracts.upgradeExecutor,
    abi: upgradeExecutorABI,
    functionName: 'executeCall',
    args: [
      coreContracts.sequencerInbox, // target
      setValidKeysetEncodeFunctionData(keyset), // targetCallData
    ],
    account,
  });

  const hash = await walletClient.writeContract(request);
  const txReceipt = await publicClient.waitForTransactionReceipt({ hash });

  return txReceipt;
}
