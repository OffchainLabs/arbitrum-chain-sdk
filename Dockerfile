# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
RUN npm install -g pnpm@10.30.3
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm build
RUN pnpm deploy --filter=@arbitrum/chain-sdk --prod --legacy --ignore-scripts /deployed

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /deployed/dist ./dist
COPY --from=builder /deployed/node_modules ./node_modules
ENTRYPOINT ["node", "/app/dist/scripting/cli.js"]
