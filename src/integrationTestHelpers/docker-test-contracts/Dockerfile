FROM ghcr.io/foundry-rs/foundry:v1.3.1 AS foundry

FROM node:20-bullseye-slim AS builder

COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge

RUN apt-get update \
    && apt-get install -y git python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

RUN mkdir nitro-contracts
WORKDIR /workspace/nitro-contracts
RUN git init . \
    && git remote add origin https://github.com/OffchainLabs/nitro-contracts.git \
    && git fetch --depth 1 origin 2f747c722d98d5fd662bfda08cd86aa534b22be2 \
    && git checkout --detach FETCH_HEAD \
    && git submodule update --init --recursive --depth 1
RUN cp scripts/config.example.ts scripts/config.ts
RUN yarn install --frozen-lockfile
RUN yarn build:all

WORKDIR /workspace
RUN mkdir token-bridge-contracts
WORKDIR /workspace/token-bridge-contracts
RUN git init . \
    && git remote add origin https://github.com/OffchainLabs/token-bridge-contracts.git \
    && git fetch --depth 1 origin 5975d8f7360816341be7f94fd333ef240f4aec23 \
    && git checkout --detach FETCH_HEAD
RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:20-bullseye-slim

WORKDIR /workspace

COPY --from=builder /workspace/nitro-contracts /workspace/nitro-contracts
COPY --from=builder /workspace/token-bridge-contracts /workspace/token-bridge-contracts
COPY entrypoint.sh /usr/local/bin/chain-sdk-int-test-contracts

RUN chmod +x /usr/local/bin/chain-sdk-int-test-contracts

ENTRYPOINT ["chain-sdk-int-test-contracts"]
