# Arbitrum Chain SDK

TypeScript SDK for [building Arbitrum chains](https://docs.arbitrum.io/launch-arbitrum-chain/a-gentle-introduction).

## Installation

Make sure you are using Node.js v18 or greater.

```bash
yarn add @arbitrum/chain-sdk viem@^1.20.0
```

## Run integration tests

Clone the branch `release` of [nitro-testnode](https://github.com/OffchainLabs/nitro-testnode), and run the testnode using the following arguments:

```bash
./test-node.bash --init --tokenbridge --l3node --l3-fee-token --l3-token-bridge
```

Then, run the integration tests:

```bash
yarn test:integration
```

## Examples

See [examples](./examples).
