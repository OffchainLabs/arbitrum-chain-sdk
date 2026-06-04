# Arbitrum Chain SDK

TypeScript SDK for [building Arbitrum chains](https://docs.arbitrum.io/launch-arbitrum-chain/a-gentle-introduction).

## Installation

Make sure you are using Node.js v18 or greater.

```bash
pnpm add @arbitrum/chain-sdk viem@^1.20.0
```

## CLI

The SDK ships a CLI that exposes its functions, workflows, and contract calls as subcommands. Each command takes a single JSON argument and prints a JSON result. Useful from shell scripts, CI, or any non-TypeScript caller.

### Install

Pull the published image from Docker Hub:

```bash
docker pull offchainlabs/arbitrum-chain-sdk:latest
docker run --rm offchainlabs/arbitrum-chain-sdk:latest <command> '<json>'
```

Or build and run it directly:

```bash
pnpm install && pnpm build
pnpm cli <command> '<json>'
```

### Usage

```
docker run --rm offchainlabs/arbitrum-chain-sdk:latest <command> '<json>' [-o <path>]
docker run --rm offchainlabs/arbitrum-chain-sdk:latest <command> --schema   [-o <path>]
```

The JSON argument can be supplied three ways:

- As a literal: `docker run --rm offchainlabs/arbitrum-chain-sdk:latest getValidators '{"rpcUrl":"...","chainId":42161,"rollup":"0x..."}'`
- From a file: `docker run --rm -v "$(pwd):/work" -w /work offchainlabs/arbitrum-chain-sdk:latest getValidators @input.json`
- From stdin: `cat input.json | docker run --rm -i offchainlabs/arbitrum-chain-sdk:latest getValidators -`

JSON with comments and trailing commas (JSONC) is accepted.

Flags:

- `-o <path>` — write the result to a file instead of stdout.
- `--schema` — print the input JSON Schema for the command and exit.

### Discovering commands

Run the CLI with no command to print the full command list:

```bash
docker run --rm offchainlabs/arbitrum-chain-sdk:latest
```

Commands fall into three groups:

- **SDK functions** — direct wrappers around SDK exports (`getValidators`, `createRollup`, …).
- **Workflows** — multi-step orchestrations (`deployNewChain`, `deployFullChain`, `transferOwnership`, `initializeTokenBridge`).
- **Contract calls** — generic read/write/encode against a contract ABI (`ArbOwner`, `Rollup@v3.2`, `Inbox`, …). Versioned entries sit alongside an unversioned alias pointing at the current default.

To see the input shape for a command:

```bash
docker run --rm offchainlabs/arbitrum-chain-sdk:latest <command> --schema
```

### Output

- **stdout** — the JSON result. `BigInt` values are serialized as decimal strings.
- **stderr** — SDK progress logs, validation errors, and stack traces.
- **Exit code** — `0` on success, `1` on any parse, validation, or runtime error.

### Example

Build a Nitro `chainConfig` for a new Arbitrum chain. This is the first call in the deploy-a-new-chain flow — given a chain ID and the chain's initial owner, the SDK fills in the full config:

```bash
docker run --rm offchainlabs/arbitrum-chain-sdk:latest prepareChainConfig '{
  "chainId": 12345,
  "arbitrum": {
    "InitialChainOwner": "0x0000000000000000000000000000000000000001"
  }
}'
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
