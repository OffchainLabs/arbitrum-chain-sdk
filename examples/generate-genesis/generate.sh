#!/usr/bin/env bash

set -euo pipefail

readonly IMAGE_NAME="offchainlabs/arbitrum-chain-sdk:v0.28.0"

for dependency in docker jq; do
  command -v "$dependency" >/dev/null || {
    printf 'Required command not found: %s\n' "$dependency" >&2
    exit 1
  }
done

mkdir -p output
output_file="output/output.json"

docker run --rm \
  --volume "$(pwd):/work:ro" \
  --workdir /work \
  "$IMAGE_NAME" \
  generateGenesis @generate-genesis.json >"$output_file"

# Validate the complete result.
jq -e '
  (.genesis | type == "object") and
  (.blockHash | test("^0x[0-9a-fA-F]{64}$")) and
  (.sendRoot | test("^0x[0-9a-fA-F]{64}$"))
' "$output_file" >/dev/null

printf 'Generated %s\n' "$output_file"
