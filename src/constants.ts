import { parseEther, parseGwei } from 'viem';

/**
 * Approximate value necessary to pay for retryables fees for `createRollup`.
 */
export const createRollupDefaultRetryablesFees = parseEther('0.125');

/**
 * Approximate value necessary to pay for retryables fees for `createTokenBridge`.
 */
export const createTokenBridgeDefaultRetryablesFees = parseEther('0.02');

/**
 * 0.1 gwei is a standard default to start the chain with. here we double that for some margin
 */
export const enqueueDefaultMaxGasPrice = parseGwei('0.2');
