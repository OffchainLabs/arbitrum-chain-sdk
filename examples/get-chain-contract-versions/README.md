# Get Orbit chain contract versions

This example uses the SDK's `getOrbitChainContractVersions` helper to inspect the deployed Nitro contract versions for an Orbit chain on Arbitrum.

It runs against the current repository checkout, so `pnpm dev` builds the local SDK before executing the example.

It requires:

- Docker installed and available on `PATH`
- an inbox address for the chain you want to inspect
- a parent chain RPC URL

## Setup

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Create `.env`

   ```bash
   cp .env.example .env
   ```

3. Run the example

   ```bash
   pnpm dev
   ```

## Parent-chain RPC behavior

This example derives the parent chain id directly from `PARENT_CHAIN_RPC` and passes that id to the SDK as `networkOrChainId`. That means you only need the RPC URL in `.env`.

The SDK then runs the Dockerized versioner in `fork` mode and builds the Docker env for you:

```env
PARENT_CHAIN_RPC=https://arb1.arbitrum.io/rpc
```

For local RPC URLs, the SDK rewrites the container-facing RPC env vars (`PARENT_CHAIN_RPC`, and `FORK_URL` when fork mode is used) from `localhost` / `127.0.0.1` to `host.docker.internal`, and adds Docker's `host-gateway` mapping so the container can reach the host on Linux Docker Engine as well as Docker Desktop.

This example uses the SDK's default pinned `chain-actions` image. If you need a custom Docker image, update the script to pass the helper's optional `image` parameter explicitly.

The script prints the discovered contract versions and any upgrade recommendation as JSON.
