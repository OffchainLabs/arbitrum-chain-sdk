import {
  Address,
  encodeFunctionData as viemEncodeFunctionData,
  EncodeFunctionDataParameters as ViemEncodeFunctionDataParameters,
} from 'viem';
import { GetFunctionName } from './types/utils';
import { sequencerInboxABI } from './contracts/SequencerInbox';
import { arbOwnerABI } from './contracts/ArbOwner';
import {
  upgradeExecutorEncodeFunctionData,
  UpgradeExecutorFunctionName,
} from './upgradeExecutorEncodeFunctionData';
import { upgradeExecutorABI } from './contracts/UpgradeExecutor';

type ABIs = typeof sequencerInboxABI | typeof arbOwnerABI | typeof upgradeExecutorABI;
type FunctionName<TAbi extends ABIs> = GetFunctionName<TAbi>;

type EncodeFunctionDataParameters<
  TAbi extends ABIs,
  TFunctionName extends FunctionName<TAbi>,
> = ViemEncodeFunctionDataParameters<TAbi, TFunctionName>;

function encodeFunctionData<TAbi extends ABIs, TFunctionName extends GetFunctionName<TAbi>>({
  abi,
  functionName,
  args,
}: EncodeFunctionDataParameters<TAbi, TFunctionName>) {
  return viemEncodeFunctionData({
    abi,
    functionName,
    args,
  } as unknown as ViemEncodeFunctionDataParameters<TAbi, TFunctionName>);
}

export function prepareUpgradeExecutorCallParameters<
  TAbi extends ABIs,
  TFunctionName extends FunctionName<TAbi>,
>(
  params: EncodeFunctionDataParameters<TAbi, TFunctionName> &
    (
      | {
          to: Address;
          upgradeExecutor: false;
          value?: bigint;
        }
      | {
          to: Address;
          upgradeExecutor: Address;
          value?: bigint;
          upgradeExecutorFunctionName?: Extract<
            UpgradeExecutorFunctionName,
            'execute' | 'executeCall'
          >;
        }
    ),
) {
  const { upgradeExecutor, value = BigInt(0) } = params;
  if (!upgradeExecutor) {
    return {
      to: params.to,
      data: encodeFunctionData(params),
      value,
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: params.upgradeExecutorFunctionName ?? 'executeCall',
      args: [
        params.to, // target
        encodeFunctionData(params), // targetCallData
      ],
    }),
    value,
  };
}
