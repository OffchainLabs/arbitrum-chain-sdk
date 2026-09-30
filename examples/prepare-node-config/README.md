# Prepare a Nitro node configuration

This example creates a `node-config.json` file for a deployed Arbitrum chain. The file
contains the chain configuration, core contract addresses, parent-chain connection, RPC
settings, and Nitro node roles.

Private keys are not written by default. Adding either the batch-poster or validator private
key requires two explicit opt-ins:

- The SDK call must set `insecure: true`.
- This example must be run with `--insecure`.

## Setup

Create the environment file and configure the deployment transaction and RPC endpoints:

```bash
cp .env.example .env
```

`ORBIT_DEPLOYMENT_TRANSACTION_HASH` identifies the transaction from which the example obtains
the chain configuration and core contract addresses.

## Generate a key-free configuration

Run the example without `--insecure`:

```bash
pnpm dev
```

This is equivalent to calling:

```typescript
prepareNodeConfig({
  insecure: false,
  // No private keys
  // ...
});
```

If either private-key environment variable is present, the example warns that it was ignored.
The resulting `node-config.json` contains no wallet private keys. Review RPC URLs and any
additional settings for other credentials before treating it as a non-secret deployment
artifact.

Because no keys were provided, `prepareNodeConfig` disables the batch-poster and staker roles.
A production runtime must enable the roles it intends to operate when it injects their
credentials.

As a defense-in-depth CI check, reject generated files containing a `private-key` property:

```bash
if jq -e '[.. | objects | select(has("private-key"))] | length > 0' node-config.json; then
  echo "Private key found in node-config.json"
  exit 1
fi
```

## Production workflow

The recommended production model is a non-secret configuration artifact plus credentials
injected by the runtime. Do not use `--insecure` in the normal production path.

### 1. Store the key-free configuration

Generate `node-config.json` with `insecure: false`, review it, and store it in the deployment
artifact or configuration system. Mount it read-only in the Nitro container.

Nitro loads a JSON configuration file with:

```bash
nitro --conf.file=/config/node-config.json
```

See the official documentation for
[generating a node configuration with the Chain SDK](https://docs.arbitrum.io/launch-arbitrum-chain/deploy/configure-node)
and [mounting a Nitro configuration file](https://docs.arbitrum.io/run-arbitrum-node/run-full-node#node-config-file).

### 2. Store credentials separately

Keep the batch-poster and validator credentials in a production secret manager, such as
Vault, a cloud secret manager, or an external Kubernetes secret provider. Prefer an external
signer backed by KMS or an HSM where the deployment supports it.

Use separate accounts for the batch poster and active validator. Each account has different
funding and authorization requirements, and Nitro rejects using the same active address for
both roles.

### 3. Inject secrets and role settings at startup

Start Nitro with an environment-variable prefix:

```bash
nitro \
  --conf.file=/config/node-config.json \
  --conf.env-prefix=NITRO
```

Have the orchestrator populate the following variables from its secret provider:

```text
NITRO_NODE_BATCH__POSTER_ENABLE=true
NITRO_NODE_BATCH__POSTER_PARENT__CHAIN__WALLET_PRIVATE__KEY=<64 hex characters>

NITRO_NODE_STAKER_ENABLE=true
NITRO_NODE_STAKER_STRATEGY=MakeNodes
NITRO_NODE_STAKER_PARENT__CHAIN__WALLET_PRIVATE__KEY=<64 hex characters>
```

Private keys passed directly to Nitro must omit the `0x` prefix, matching the format produced
by `prepareNodeConfig`.

Nitro converts a single underscore to a configuration dot and a double underscore to a
hyphen. Environment variables are applied after configuration files and CLI flags, so they
override the disabled roles in the key-free template. See
[Nitro configuration precedence and environment variables](https://docs.arbitrum.io/run-arbitrum-node/nitro/configuration-system#environment-variables).

Only inject the variables required by that process. For example, a dedicated batch-poster
node should not receive the validator key.

## Explicitly embedding private keys

For isolated development only, private keys can be deliberately embedded:

```bash
pnpm dev -- --insecure
chmod 600 node-config.json
```

Both `BATCH_POSTER_PRIVATE_KEY` and `VALIDATOR_PRIVATE_KEY` must be set. The resulting file is
a secret: never commit it, place it in a normal deployment artifact, or persist it in a
production configuration store.
