FROM node:20-bullseye-slim
RUN apt-get update && \
    apt-get install -y git docker.io python3 chromium build-essential
WORKDIR /workspace
RUN git clone https://github.com/OffchainLabs/token-bridge-contracts.git ./
RUN git checkout e222d4cdaeefc87773e39a5fce980667a80b886b
RUN yarn install
RUN yarn build
ENTRYPOINT ["yarn"]
