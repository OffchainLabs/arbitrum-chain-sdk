import { Address } from 'viem';
import type { ExtractAbiFunctionNames } from 'abitype';
import { sequencerInboxABI } from './contracts/SequencerInbox';
import { arbOwnerABI } from './contracts/ArbOwner';
import { inboxABI } from './contracts/Inbox';
import { UpgradeExecutorFunctionName } from './upgradeExecutorEncodeFunctionData';
import {
  ContractEncodeFunctionDataParameters,
  prepareContractCallParameters,
} from './contractTransactionRequests';

type ABIs = typeof sequencerInboxABI | typeof arbOwnerABI | typeof inboxABI;

type EncodeFunctionDataParameters<
  TAbi extends ABIs,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>,
> = ContractEncodeFunctionDataParameters<TAbi, TFunctionName>;

type PrepareUpgradeExecutorCallParameters<
  TAbi extends ABIs,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>,
> = Omit<EncodeFunctionDataParameters<TAbi, TFunctionName>, 'abi'> & {
  abi: TAbi;
  to: Address;
  upgradeExecutor: Address | false;
  value?: bigint;
  upgradeExecutorFunctionName?: Extract<UpgradeExecutorFunctionName, 'execute' | 'executeCall'>;
};

export function prepareUpgradeExecutorCallParameters<
  TAbi extends ABIs,
  TFunctionName extends ExtractAbiFunctionNames<TAbi>,
>(params: PrepareUpgradeExecutorCallParameters<TAbi, TFunctionName>) {
  return prepareContractCallParameters<TAbi, TFunctionName>(params);
}
