ARG NITRO_NODE_TAG=v3.9.8-4624977
ARG FOUNDRY_IMAGE=ghcr.io/foundry-rs/foundry:v1.3.1

FROM offchainlabs/nitro-node:${NITRO_NODE_TAG} AS nitro
FROM ${FOUNDRY_IMAGE} AS foundry

FROM node:24-bookworm-slim AS base

WORKDIR /workspace

RUN corepack enable

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY src/package.json ./src/package.json

RUN pnpm install --frozen-lockfile

COPY src ./src

RUN pnpm build && pnpm --filter @arbitrum/chain-sdk pack --pack-destination /tmp/chain-sdk

FROM base AS runtime-dependencies

COPY --from=build /tmp/chain-sdk/*.tgz /tmp/chain-sdk.tgz

RUN npm init --yes \
    && npm install --omit=dev /tmp/chain-sdk.tgz viem@^1.20.0 \
    && npm cache clean --force \
    && rm /tmp/chain-sdk.tgz package-lock.json

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PATH=/workspace/node_modules/.bin:$PATH
WORKDIR /workspace

COPY --from=nitro /usr/local/bin/genesis-generator /usr/local/bin/genesis-generator
COPY --from=foundry /usr/local/bin/cast /usr/local/bin/cast
COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge
COPY --from=runtime-dependencies /workspace/package.json /workspace/package.json
COPY --from=runtime-dependencies /workspace/node_modules /workspace/node_modules

USER node

ENTRYPOINT ["chain-sdk"]
