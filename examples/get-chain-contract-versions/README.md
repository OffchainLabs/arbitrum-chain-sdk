# Get Orbit chain contract versions

This example uses the SDK's `getOrbitChainContractVersions` helper to inspect the deployed Nitro contract versions for an Orbit chain on Arbitrum.

It runs against the current repository checkout, so `pnpm dev` builds the local SDK before executing the example.

It requires:

- an inbox address for the chain you want to inspect
- a parent chain RPC URL

Optional:

- Docker installed and available on `PATH` when `EXECUTION_MODE=docker`
- a custom Orbit Actions image via `ORBIT_ACTIONS_IMAGE` when using docker mode

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

The example passes `INBOX_ADDRESS` and `PARENT_CHAIN_RPC` directly to the SDK helper. It does not derive or require a separate parent chain id.

By default the SDK uses the native `orbit-actions` versioner:

```env
PARENT_CHAIN_RPC=https://arb1.arbitrum.io/rpc
```

If you want to force Docker execution instead, set:

```env
EXECUTION_MODE=docker
```

In docker mode, the SDK runs `yarn orbit:contracts:version` inside the configured Orbit Actions image. For local RPC URLs, it rewrites `PARENT_CHAIN_RPC` from `localhost` / `127.0.0.1` to `host.docker.internal`, and adds Docker's `host-gateway` mapping so the container can reach the host on Linux Docker Engine as well as Docker Desktop.

This example uses the SDK's default pinned `chain-actions` image in docker mode. If you need a custom image, set `ORBIT_ACTIONS_IMAGE`.

The script logs the discovered contract versions and any upgrade recommendation to stdout.
