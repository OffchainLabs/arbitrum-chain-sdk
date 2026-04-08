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

The script prints the discovered contract versions and any upgrade recommendation as JSON.
