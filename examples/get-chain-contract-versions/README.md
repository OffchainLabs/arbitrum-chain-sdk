# Get Orbit chain contract versions

This example uses the SDK's `getChainContractVersions` helper to inspect the deployed Nitro contract versions for an Orbit chain on Arbitrum.

It runs against the current repository checkout, so `pnpm dev` builds the local SDK before executing the example.

It requires:

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

The example passes `INBOX_ADDRESS` and `PARENT_CHAIN_RPC` directly to the SDK helper. It does not derive or require a separate parent chain id.

The SDK uses the native `chain-actions` versioner:

```env
PARENT_CHAIN_RPC=https://arb1.arbitrum.io/rpc
```

The script logs the discovered contract versions and any upgrade recommendation to stdout.
