FROM ghcr.io/foundry-rs/foundry:v1.3.1 AS foundry

FROM node:20-bullseye-slim

COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge

WORKDIR /workspace
COPY . /workspace
RUN cp scripts/config.example.ts scripts/config.ts
RUN yarn install
RUN yarn build:all

ENTRYPOINT ["yarn"]
