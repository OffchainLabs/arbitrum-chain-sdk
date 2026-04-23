import { ContractFunctionName, encodeFunctionData, keccak256, toHex } from 'viem';

import { upgradeExecutorABI } from './contracts/UpgradeExecutor';

// Roles
/**
 * 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775
 */
export const UPGRADE_EXECUTOR_ROLE_ADMIN = keccak256(toHex('ADMIN_ROLE'));

/**
 * 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63
 */
export const UPGRADE_EXECUTOR_ROLE_EXECUTOR = keccak256(toHex('EXECUTOR_ROLE'));
export type UpgradeExecutorRole =
  | typeof UPGRADE_EXECUTOR_ROLE_ADMIN
  | typeof UPGRADE_EXECUTOR_ROLE_EXECUTOR;

export type UpgradeExecutorAbi = typeof upgradeExecutorABI;
export type UpgradeExecutorFunctionName = ContractFunctionName<UpgradeExecutorAbi>;

// Discriminated union over UpgradeExecutor's write entry points. Each branch carries a
// literal `functionName` + the matching `args` tuple, so the `switch` below passes a
// concrete literal to viem — that avoids the correlated-union limitation
// (microsoft/TypeScript#30581) which only triggers when `functionName` is itself a generic.
export type UpgradeExecutorEncodeFunctionDataParameters =
  | { functionName: 'execute'; args: readonly [`0x${string}`, `0x${string}`] }
  | { functionName: 'executeCall'; args: readonly [`0x${string}`, `0x${string}`] }
  | { functionName: 'grantRole'; args: readonly [`0x${string}`, `0x${string}`] }
  | { functionName: 'revokeRole'; args: readonly [`0x${string}`, `0x${string}`] };

// Encodes a function call to be sent through the UpgradeExecutor.
export function upgradeExecutorEncodeFunctionData(
  params: UpgradeExecutorEncodeFunctionDataParameters,
) {
  switch (params.functionName) {
    case 'execute':
      return encodeFunctionData({
        abi: upgradeExecutorABI,
        functionName: 'execute',
        args: params.args,
      });
    case 'executeCall':
      return encodeFunctionData({
        abi: upgradeExecutorABI,
        functionName: 'executeCall',
        args: params.args,
      });
    case 'grantRole':
      return encodeFunctionData({
        abi: upgradeExecutorABI,
        functionName: 'grantRole',
        args: params.args,
      });
    case 'revokeRole':
      return encodeFunctionData({
        abi: upgradeExecutorABI,
        functionName: 'revokeRole',
        args: params.args,
      });
  }
}
