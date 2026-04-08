import { parseEther } from 'viem';

/**
 * Approximate value necessary to pay for retryables fees for `createRollup`.
 */
export const createRollupDefaultRetryablesFees = parseEther('0.125');

/**
 * Approximate value necessary to pay for retryables fees for `createTokenBridge`.
 */
export const createTokenBridgeDefaultRetryablesFees = parseEther('0.02');

export const DEFAULT_ORBIT_ACTIONS_IMAGE = 'offchainlabs/chain-actions:150d84f832ea';
