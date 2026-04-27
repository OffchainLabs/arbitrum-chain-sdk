# Arbitrum Orbit SDK

## Generating a genesis.json file and genesis blockhash and sendRoot hash

This is an example for generating a genesis.json file and obtaining the genesis blockhash and sendRoot hash based on that file.

For the contents of the genesis.json file, and what predeploys it contains, you can see the [genesis-file-generator](https://github.com/OffchainLabs/genesis-file-generator) script.

## Setup

1. Install dependencies and build the SDK project (from the root of the repository)

```bash
yarn install && yarn build
```

2. Move to the example script directory

```bash
cd examples/generate-genesis-file
```

3. Create .env file and add the env vars

```bash
cp .env.example .env
```

> [!NOTE]
> Make sure you set the correct values of the environment variables for your chain

4. Run the example

```bash
yarn dev
```
