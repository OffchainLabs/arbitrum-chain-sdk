import { Address, Hex } from 'viem';
import {
  upgradeExecutorEncodeFunctionData,
  UpgradeExecutorFunctionName,
} from './upgradeExecutorEncodeFunctionData';

type UpgradeExecutorEnvelopeOff = {
  to: Address;
  upgradeExecutor: false;
  value?: bigint;
};

type UpgradeExecutorEnvelopeOn = {
  to: Address;
  upgradeExecutor: Address;
  value?: bigint;
  upgradeExecutorFunctionName?: Extract<UpgradeExecutorFunctionName, 'execute' | 'executeCall'>;
};

export type UpgradeExecutorCallEnvelope = UpgradeExecutorEnvelopeOff | UpgradeExecutorEnvelopeOn;

export function prepareUpgradeExecutorCallParameters(
  encoded: Hex,
  envelope: UpgradeExecutorCallEnvelope,
) {
  const { upgradeExecutor, value = BigInt(0), to } = envelope;

  if (!upgradeExecutor) {
    return {
      to,
      data: encoded,
      value,
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: envelope.upgradeExecutorFunctionName ?? 'executeCall',
      args: [to, encoded],
    }),
    value,
  };
}
