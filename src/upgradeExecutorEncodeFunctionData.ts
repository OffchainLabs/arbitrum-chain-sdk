import { encodeFunctionData, EncodeFunctionDataParameters, keccak256, toHex } from 'viem';

import { upgradeExecutorABI } from './contracts/UpgradeExecutor';
import { GetFunctionName, Prettify } from './types/utils';

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

// Types for upgradeExecutorEncodeFunctionData
export type UpgradeExecutorAbi = typeof upgradeExecutorABI;
export type UpgradeExecutorFunctionName = GetFunctionName<UpgradeExecutorAbi>;
export type UpgradeExecutorEncodeFunctionDataParameters<
  TFunctionName extends UpgradeExecutorFunctionName,
> = Prettify<Omit<EncodeFunctionDataParameters<UpgradeExecutorAbi, TFunctionName>, 'abi'>>;

// Encodes a function call to be sent through the UpgradeExecutor
export function upgradeExecutorEncodeFunctionData<
  TFunctionName extends UpgradeExecutorFunctionName,
>({ functionName, args }: UpgradeExecutorEncodeFunctionDataParameters<TFunctionName>) {
  // @ts-expect-error -- todo: fix viem type issue
  return encodeFunctionData({
    abi: upgradeExecutorABI,
    functionName,
    args,
  });
}
