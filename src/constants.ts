import { parseEther } from 'viem';

/**
 * Approximate value necessary to pay for retryables fees for `createRollup`.
 */
export const createRollupDefaultRetryablesFees = parseEther('0.125');

/**
 * Approximate value necessary to pay for retryables fees for `createTokenBridge`.
 */
export const createTokenBridgeDefaultRetryablesFees = parseEther('0.02');

export const DEFAULT_ORBIT_ACTIONS_IMAGE =
  'offchainlabs/chain-actions@sha256:150d84f832ea4361bbe4876ecc89d4e5433f49b31b11d55229282b6568042c75';
