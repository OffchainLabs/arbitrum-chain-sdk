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
export const createTokenBridgeDefaultMaxGasPrice = parseGwei('0.2');

// Matches DEFAULT_SUBMISSION_FEE_PERCENT_INCREASE in @arbitrum/sdk's ParentToChildMessageGasEstimator
export const defaultSubmissionFeePercentIncrease = 300n;

// ~30% headroom over observed gas usage for token bridge retryables
export const createTokenBridgeDefaultMaxGasForContracts = 20_000_000n;
export const createTokenBridgeDefaultGasLimitForWethGateway = 100_000n;

export const DEFAULT_ORBIT_ACTIONS_IMAGE =
  'offchainlabs/chain-actions@sha256:150d84f832ea4361bbe4876ecc89d4e5433f49b31b11d55229282b6568042c75';
