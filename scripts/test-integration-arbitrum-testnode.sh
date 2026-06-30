#!/usr/bin/env bash
set -euo pipefail

ARBITRUM_TESTNODE_VERSION="${ARBITRUM_TESTNODE_VERSION:-v0.2.8}"
INTEGRATION_TEST_DECIMALS="${INTEGRATION_TEST_DECIMALS:-18}"
INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH="${INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH:-v3.2}"
NITRO_CONTRACTS_VERSION="${INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH#v}"
TESTNODE_VARIANT="${ARBITRUM_TESTNODE_VARIANT:-l3-custom-${INTEGRATION_TEST_DECIMALS}}"
IMAGE="${ARBITRUM_TESTNODE_IMAGE:-ghcr.io/offchainlabs/arbitrum-testnode-ci:${ARBITRUM_TESTNODE_VERSION}-nc${NITRO_CONTRACTS_VERSION}-${TESTNODE_VARIANT}}"
CONTAINER="${ARBITRUM_TESTNODE_CONTAINER:-arbitrum-testnode-${NITRO_CONTRACTS_VERSION}-${TESTNODE_VARIANT}}"
STARTUP_TIMEOUT_SECONDS="${ARBITRUM_TESTNODE_STARTUP_TIMEOUT_SECONDS:-120}"
ARBITRUM_TESTNODE_FEE_TOKEN_DEPLOYER_PRIVATE_KEY="${ARBITRUM_TESTNODE_FEE_TOKEN_DEPLOYER_PRIVATE_KEY:-0x84f89f9afcf4cd87bbf0a8872a1abd8ddf69364da61a2c2a5286d999383cd2c9}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run arbitrum-testnode integration tests" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to wait for arbitrum-testnode health" >&2
  exit 1
fi

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

docker pull "$IMAGE"

docker run -d \
  --name "$CONTAINER" \
  --platform linux/amd64 \
  -e TESTNODE_VARIANT="$TESTNODE_VARIANT" \
  -p 127.0.0.1:8545:8545 \
  -p 127.0.0.1:8547:8547 \
  -p 127.0.0.1:8548:8548 \
  -p 127.0.0.1:3347:8549 \
  -p 127.0.0.1:3348:8550 \
  -p 127.0.0.1:8080:8080 \
  "$IMAGE"

deadline=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
until curl -sf http://127.0.0.1:8080/health >/dev/null; do
  if (( SECONDS >= deadline )); then
    docker logs "$CONTAINER" >&2 || true
    echo "arbitrum-testnode did not become healthy within ${STARTUP_TIMEOUT_SECONDS}s" >&2
    exit 1
  fi
  sleep 1
done

if [ ! -f .env ]; then
  cp .env.example .env
fi

pnpm build

echo "Running integration tests against $CONTAINER"
ARBITRUM_TESTNODE_CONTAINER="$CONTAINER" \
INTEGRATION_TEST_DECIMALS="$INTEGRATION_TEST_DECIMALS" \
INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH="$INTEGRATION_TEST_NITRO_CONTRACTS_BRANCH" \
NITRO_TESTNODE_L3_TOKEN_BRIDGE_DEPLOYER_PRIVATE_KEY="$ARBITRUM_TESTNODE_FEE_TOKEN_DEPLOYER_PRIVATE_KEY" \
CI=true \
pnpm exec vitest --config vitest.integration.config.ts --reporter verbose --run "$@"
