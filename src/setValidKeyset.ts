import { Account, PublicClient, Transport, Chain, WalletClient } from 'viem';

import { upgradeExecutorABI } from './contracts/UpgradeExecutor';
import { validateParentChain } from './types/ParentChain';
import { CoreContracts } from './types/CoreContracts';
import { setValidKeysetEncodeFunctionData } from './setValidKeysetEncodeFunctionData';

export type SetValidKeysetParams<TChain extends Chain | undefined> = {
  coreContracts: Pick<CoreContracts, 'upgradeExecutor' | 'sequencerInbox'>;
  keyset: `0x${string}`;
  publicClient: PublicClient<Transport, TChain>;
  walletClient: WalletClient<Transport, Chain, Account>;
};

export async function setValidKeyset({
  coreContracts,
  keyset,
  publicClient,
  walletClient,
}: SetValidKeysetParams<Chain | undefined>) {
  validateParentChain(publicClient);
  const account = walletClient.account;

  if (typeof account === 'undefined') {
    throw new Error('account is undefined');
  }

  // Concrete, non-generic `writeContract` call. The previous `simulateContract` →
  // `writeContract(request)` hand-off triggered viem v2's correlated-union limitation
  // because `request`'s generic parameters didn't align with the writeContract overload
  // (microsoft/TypeScript#30581). Skip the pre-simulation round-trip and drive the write
  // directly with the literal ABI + functionName.
  const hash = await walletClient.writeContract({
    address: coreContracts.upgradeExecutor,
    abi: upgradeExecutorABI,
    functionName: 'executeCall',
    args: [coreContracts.sequencerInbox, setValidKeysetEncodeFunctionData(keyset)],
    account,
    chain: walletClient.chain,
  });
  const txReceipt = await publicClient.waitForTransactionReceipt({ hash });

  return txReceipt;
}
