import { parseEther } from 'viem';

/**
 * Approximate value necessary to pay for retryables fees for `createRollup`.
 */
export const createRollupDefaultRetryablesFees = parseEther('0.125');

/**
 * Approximate value necessary to pay for retryables fees for `createTokenBridge`.
 */
export const createTokenBridgeDefaultRetryablesFees = parseEther('0.02');

export const enqueueDefaultMaxGasPrice = 200_000_000n; // 0.2 gwei
