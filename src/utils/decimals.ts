import { BigNumber } from 'ethers';
import {
  scaleFrom18DecimalsToNativeTokenDecimals as ethers_scaleFrom18DecimalsToNativeTokenDecimals,
  scaleFromNativeTokenDecimalsTo18Decimals as ethers_scaleFromNativeTokenDecimalsTo18Decimals,
} from '@arbitrum/sdk';

/**
 * Scales a value from 18 decimals to the number of decimals of the native token.
 *
 * @param param.amount The value to scale.
 * @param param.decimals The number of decimals of the native token.
 *
 * @returns The scaled value.
 */
export function scaleFrom18DecimalsToNativeTokenDecimals({
  amount,
  decimals,
}: {
  amount: bigint;
  decimals: number;
}): bigint {
  const amountBigNumber = BigNumber.from(amount);
  const result = ethers_scaleFrom18DecimalsToNativeTokenDecimals({
    amount: amountBigNumber,
    decimals,
  });
  return BigInt(result.toString());
}

/**
 * Scales a value from the number of decimals of the native token to 18 decimals.
 *
 * @param param.amount The value to scale.
 * @param param.decimals The number of decimals of the native token.
 *
 * @returns The scaled value.
 */
export function scaleFromNativeTokenDecimalsTo18Decimals({
  amount,
  decimals,
}: {
  amount: bigint;
  decimals: number;
}): bigint {
  const amountBigNumber = BigNumber.from(amount);
  const result = ethers_scaleFromNativeTokenDecimalsTo18Decimals({
    amount: amountBigNumber,
    decimals,
  });
  return BigInt(result.toString());
}
