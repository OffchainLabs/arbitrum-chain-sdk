ARG NITRO_NODE_TAG=v3.9.8-4624977
ARG FOUNDRY_IMAGE=ghcr.io/foundry-rs/foundry:v1.3.1

FROM offchainlabs/nitro-node:${NITRO_NODE_TAG} AS nitro
FROM ${FOUNDRY_IMAGE} AS foundry

FROM node:20-bookworm-slim AS builder

RUN npm install -g pnpm@10.30.3
WORKDIR /repo

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile --ignore-scripts
RUN pnpm build
RUN pnpm deploy --filter=@arbitrum/chain-sdk --prod --legacy --ignore-scripts /deployed

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /deployed/dist ./dist
COPY --from=builder --chown=node:node /deployed/node_modules ./node_modules

COPY --from=nitro /usr/local/bin/genesis-generator /usr/local/bin/genesis-generator
COPY --from=foundry /usr/local/bin/cast /usr/local/bin/cast
COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge

USER node

ENTRYPOINT ["node", "/app/dist/scripting/cli.js"]