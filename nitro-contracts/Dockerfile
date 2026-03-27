FROM ghcr.io/foundry-rs/foundry:v1.3.1 AS foundry

FROM node:20-bullseye-slim AS builder

COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

RUN git init . \
    && git remote add origin https://github.com/OffchainLabs/nitro-contracts.git \
    && git fetch --depth 1 origin 2f747c722d98d5fd662bfda08cd86aa534b22be2 \
    && git checkout --detach FETCH_HEAD \
    && git submodule update --init --recursive --depth 1

RUN cp scripts/config.example.ts scripts/config.ts
RUN yarn install --frozen-lockfile
RUN yarn build:all

FROM node:20-bullseye-slim

WORKDIR /workspace
COPY --from=builder /workspace/package.json /workspace/package.json
COPY --from=builder /workspace/yarn.lock /workspace/yarn.lock
COPY --from=builder /workspace/hardhat.config.ts /workspace/hardhat.config.ts
COPY --from=builder /workspace/tsconfig.json /workspace/tsconfig.json
COPY --from=builder /workspace/scripts /workspace/scripts
COPY --from=builder /workspace/test/contract /workspace/test/contract
COPY --from=builder /workspace/build /workspace/build
COPY --from=builder /workspace/out /workspace/out
COPY --from=builder /workspace/node_modules /workspace/node_modules

ENTRYPOINT ["yarn"]
