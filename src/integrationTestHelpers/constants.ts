import { parseAbi } from 'viem';
import { ethers } from 'ethers';

export const testConstants = {
  DEFAULT_ANVIL_IMAGE: 'ghcr.io/foundry-rs/foundry:v1.3.1',
  DEFAULT_NITRO_IMAGE: 'offchainlabs/nitro-node:v3.9.5-66e42c4',
  DEFAULT_NITRO_CONTRACTS_IMAGE: 'ghcr.io/offchainlabs/chain-sdk-nitro-contracts:v3.2.0-2f747c7',
  DEFAULT_L2_CHAIN_ID: 421_337,
  DEFAULT_L3_CHAIN_ID: 421_338,
  DEFAULT_L1_RPC_PORT: 9645,
  DEFAULT_L2_RPC_PORT: 8747,
  DEFAULT_SEPOLIA_FORK_BLOCK_NUMBER: 10_490_000,
  DEFAULT_SOURCE_DEPLOYER_PRIVATE_KEY:
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  DEFAULT_SEPOLIA_RPC: 'https://sepolia.gateway.tenderly.co',
  DEFAULT_SEPOLIA_BEACON_RPC: 'https://ethereum-sepolia-beacon-api.publicnode.com',
  CREATE2_FACTORY: '0x4e59b44847b379578588920cA78FbF26c0B4956C',
  CREATE2_DEPLOYER: '0x3fab184622dc19b6109349b94811493bf2a45362',
  CREATE2_DEPLOYER_TX:
    '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
  inboxFundingAbi: parseAbi([
    'function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)',
    'function createRetryableTicketNoRefundAliasRewrite(address to,uint256 l2CallValue,uint256 maxSubmissionCost,address excessFeeRefundAddress,address callValueRefundAddress,uint256 gasLimit,uint256 maxFeePerGas,bytes data) payable returns (uint256)',
  ]),
  LOW_L2_FEE_OVERRIDES: {
    maxFeePerGas: ethers.BigNumber.from(2),
    maxPriorityFeePerGas: ethers.BigNumber.from(0),
  },
  NITRO_DEPLOY_POLLING_INTERVAL_MS: 100,
};
