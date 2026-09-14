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

# Validate the complete result before replacing the extracted files.
jq -e '
  (.genesis | type == "object") and
  (.blockHash | test("^0x[0-9a-fA-F]{64}$")) and
  (.sendRoot | test("^0x[0-9a-fA-F]{64}$"))
' "$output_file" >/dev/null

jq -e '.genesis' "$output_file" >output/genesis.json
jq -r '.blockHash' "$output_file" >output/block-hash.txt
jq -r '.sendRoot' "$output_file" >output/send-root.txt

printf 'Generated files in output:\n'
printf '  output.json\n  genesis.json\n  block-hash.txt\n  send-root.txt\n'
jq -r '"Block hash: \(.blockHash)\nSend root:  \(.sendRoot)"' "$output_file"
