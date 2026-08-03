#!/bin/sh
set -eu

CONFIG_ROOT="/opt/arbitrum-testnode/runtime-config"
POLL_INTERVAL="100ms"

for config in "$CONFIG_ROOT/l2-nodeConfig.json" "$CONFIG_ROOT/l3-nodeConfig.json"; do
  if [ ! -f "$config" ]; then
    continue
  fi

  patched_config="${config}.fast-polling"
  jq --arg poll_interval "$POLL_INTERVAL" '
    .node["parent-chain-reader"]["poll-interval"] = $poll_interval
    | .node["delayed-sequencer"]["rescan-interval"] = $poll_interval
  ' "$config" >"$patched_config"
  mv "$patched_config" "$config"
done

exec /usr/local/bin/arbitrum-testnode
