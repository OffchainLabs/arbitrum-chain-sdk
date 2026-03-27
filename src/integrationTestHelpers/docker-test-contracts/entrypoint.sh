#!/bin/sh

set -eu

if [ "$#" -lt 2 ]; then
  echo "usage: chain-sdk-int-test-contracts <nitro-contracts|token-bridge-contracts> <command> [args...]" >&2
  exit 1
fi

workspace="$1"
shift

case "$workspace" in
  nitro-contracts)
    cd /workspace/nitro-contracts
    ;;
  token-bridge-contracts)
    cd /workspace/token-bridge-contracts
    ;;
  *)
    echo "unknown workspace: $workspace" >&2
    exit 1
    ;;
esac

exec yarn "$@"
