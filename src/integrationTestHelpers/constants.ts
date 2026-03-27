import { Address } from 'viem';
import { ethers } from 'ethers';

export const testConstants = {
  ANVIL_IMAGE: 'ghcr.io/foundry-rs/foundry:v1.3.1',
  NITRO_IMAGE: 'offchainlabs/nitro-node:v3.9.5-66e42c4',
  DEFAULT_NITRO_CONTRACTS_IMAGE:
    'ghcr.io/offchainlabs/chain-sdk-nitro-contracts-anvil:v3.2.0-2f747c7',
  DEFAULT_TOKEN_BRIDGE_CONTRACTS_IMAGE:
    'ghcr.io/offchainlabs/chain-sdk-token-bridge-contracts-anvil:v1.2.5-5975d8f73608',
  DEPLOYER_PRIVATE_KEY:
    '0x490d84b7602e4b470af4f86a3ad095607a8bb5a4fa8ba148f41fcfd236b4fdf5' as Address,
  L2_CHAIN_ID: 421_337,
  L3_CHAIN_ID: 421_338,
  L1_RPC_PORT: 9545,
  L2_RPC_PORT: 9546,
  L3_RPC_PORT: 9547,
  SEPOLIA_FORK_BLOCK_NUMBER: 10_490_000,
  SEPOLIA_RPC: 'https://sepolia.gateway.tenderly.co',
  SEPOLIA_BEACON_RPC: 'https://ethereum-sepolia-beacon-api.publicnode.com',
  CREATE2_FACTORY: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
  CREATE2_DEPLOYER: '0x3fab184622dc19b6109349b94811493bf2a45362',
  CREATE2_DEPLOYER_TX:
    '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
  LOW_L2_FEE_OVERRIDES: {
    maxFeePerGas: ethers.utils.parseUnits('0.1', 'gwei'),
    maxPriorityFeePerGas: ethers.BigNumber.from(0),
  },
  NITRO_DEPLOY_POLLING_INTERVAL_MS: 100,
  POLLING_INTERVAL: 100,
};
