# Generate a custom genesis

`generateGenesis` is a CLI command, not an SDK function exported by `@arbitrum/chain-sdk`. It requires the external `genesis-generator` binary and `@arbitrum/genesis-file-generator`, which are bundled only in the Docker image and are not included in the SDK's npm package.

This example uses the published `offchainlabs/arbitrum-chain-sdk:v0.28.0` Docker image, calls the `generateGenesis` CLI command, and writes the full CLI result to `output/output.json`.

The sample adds one account with a balance of `1000000000000000000` wei from `custom-alloc.json`. Edit that file and `generate-genesis.json` to set your chain ID, chain owner, ArbOS version, initial L1 base fee, and allocation. The allocation path is resolved inside the container, where this directory is mounted at `/work`.

The Nitro genesis generator is bundled in the published image; its version is not a `generateGenesis` JSON parameter.

## Requirements

- Docker (running)
- `jq`

## Run

Run the script from `examples/generate-genesis`. From the repository root:

```bash
cd examples/generate-genesis
./generate.sh
```

Each run overwrites `output/output.json` and validates the result. This is the only file the script writes. No RPC endpoint, private key, or deployed rollup is needed.

Docker downloads the image automatically if it is not available locally. Run the underlying CLI call from the example directory to inspect the full JSON result:

```bash
docker run --rm \
  --volume "$(pwd):/work:ro" \
  --workdir /work \
  offchainlabs/arbitrum-chain-sdk:v0.28.0 \
  generateGenesis @generate-genesis.json
```

## Using the generated values

For a custom genesis rollup, use `blockHash` and `sendRoot` from `output/output.json`, in that order, as `genesisAssertionState.globalState.bytes32Vals`. The `genesis` field contains the genesis configuration for initializing Nitro.

The chain configuration used to create the rollup must match `serializedChainConfig` in the generated genesis. Set the deployment's `dataCostEstimate` to the same non-zero value as `arbOSInit.initialL1BaseFee` (the example's `l1BaseFee`). Changing the genesis or its chain configuration requires regenerating the hash and send root.
