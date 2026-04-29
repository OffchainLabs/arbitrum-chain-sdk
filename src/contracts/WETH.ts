// Sources:
// * https://docs.arbitrum.io/build-decentralized-apps/reference/contract-addresses#core-contracts-1
// * https://github.com/OffchainLabs/arbitrum-token-bridge/blob/master/packages/arb-token-bridge-ui/src/util/networksNitroTestnode.ts
// * https://docs.base.org/chain/base-contracts#base-mainnet
// * https://docs.base.org/chain/base-contracts#base-testnet-sepolia
export const wethAddress = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  1337: '0x217788c286797D56Cd59aF5e493f3699C39cbbe8',
  8453: '0x4200000000000000000000000000000000000006',
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  42170: '0x722E8BdD2ce80A4422E880164f2079488e115365',
  84532: '0x4200000000000000000000000000000000000006',
  412346: '0xF5fE98ee962e3E077A75FBe6fE8aBaeF80F3c12d',
  421614: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
  11155111: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
} as const;

// nitro testnode l1 and l2 are based on https://github.com/OffchainLabs/nitro-testnode/pull/117
