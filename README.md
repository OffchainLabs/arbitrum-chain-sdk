# Arbitrum Chain SDK

TypeScript SDK for [building Arbitrum chains](https://docs.arbitrum.io/launch-arbitrum-chain/a-gentle-introduction).

## Installation

Make sure you are using Node.js v18 or greater.

```bash
pnpm add @arbitrum/chain-sdk viem@^1.20.0
```

## Run integration tests

Clone the branch `release` of [nitro-testnode](https://github.com/OffchainLabs/nitro-testnode), and run the testnode using the following arguments:

```bash
./test-node.bash --init --tokenbridge --l3node --l3-fee-token --l3-token-bridge
```

Then, run the integration tests:

```bash
pnpm test:integration
```

## Examples

See [examples](./examples).

## CLI (Docker)

The SDK ships a Docker image for running workflows without installing anything locally.

### Generate a JSON Schema for a command

```bash
docker run --rm offchainlabs/arbitrum-chain-sdk:cli-rc deployFullChain --schema > deployFullChain.schema.json
```

Point your editor at this schema (via a `$schema` key in your config file or a `json.schemas` mapping in VS Code settings) to get autocomplete and inline validation as you write the input.

### Run `deployFullChain` with a mounted config file

```bash
docker run --rm \
  -v "$PWD/deployFullChain.jsonc:/config/deployFullChain.jsonc:ro" \
  offchainlabs/arbitrum-chain-sdk:cli-rc \
  deployFullChain @/config/deployFullChain.jsonc
```

The config file can be JSON or JSONC (comments and trailing commas allowed). The `@` prefix tells the CLI to read the file at that path inside the container. Stdout is the deployment result as JSON; progress messages go to stderr.
