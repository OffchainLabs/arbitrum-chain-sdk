import { Address } from 'viem';
import { GetFunctionName } from './types/utils';
import { sequencerInboxABI } from './contracts/SequencerInbox';
import { arbOwnerABI } from './contracts/ArbOwner';
import { inboxABI } from './contracts/Inbox';
import { UpgradeExecutorFunctionName } from './upgradeExecutorEncodeFunctionData';
import {
  ContractEncodeFunctionDataParameters,
  prepareContractCallParameters,
} from './contractTransactionRequests';

type ABIs = typeof sequencerInboxABI | typeof arbOwnerABI | typeof inboxABI;
type FunctionName<TAbi extends ABIs> = GetFunctionName<TAbi>;

type EncodeFunctionDataParameters<
  TAbi extends ABIs,
  TFunctionName extends FunctionName<TAbi>,
> = ContractEncodeFunctionDataParameters<TAbi, TFunctionName>;

type PrepareUpgradeExecutorCallParameters<
  TAbi extends ABIs,
  TFunctionName extends FunctionName<TAbi>,
> = Omit<EncodeFunctionDataParameters<TAbi, TFunctionName>, 'abi'> & {
  abi: TAbi;
  to: Address;
  upgradeExecutor: Address | false;
  value?: bigint;
  upgradeExecutorFunctionName?: Extract<UpgradeExecutorFunctionName, 'execute' | 'executeCall'>;
};

export function prepareUpgradeExecutorCallParameters<
  TAbi extends ABIs,
  TFunctionName extends FunctionName<TAbi>,
>(params: PrepareUpgradeExecutorCallParameters<TAbi, TFunctionName>) {
  return prepareContractCallParameters<TAbi, TFunctionName>(params);
}
