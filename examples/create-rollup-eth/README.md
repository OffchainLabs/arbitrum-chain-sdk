# Arbitrum Chain SDK

## Deploying a rollup using ETH as gas token

This is an example for deploying the rollup contracts for your Orbit chain to its parent chain.

```typescript
const createRollupConfig = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
  chainId: BigInt(chainId),
  owner: deployer.address,
  chainConfig: prepareChainConfig({
    chainId,
    arbitrum: {
      InitialChainOwner: deployer.address,
      DataAvailabilityCommittee: true,
    },
  }),
});

await createRollup({
  params: {
    config: createRollupConfig,
    batchPosters: [batchPoster],
    validators: [validator],
  },
  account: deployer,
  parentChainPublicClient,
});
```

## Setup

1. Install dependencies

   ```bash
   yarn install
   ```

2. Create .env file and add the env vars

   ```bash
   cp .env.example .env
   ```

3. Run the example
   ```bash
   yarn dev
   ```

There is an option to deploy the rollup contracts using more low-level methods as demonstrated in `low_level.ts` or `yarn dev:low-level`.

[Read full documentation](https://docs.arbitrum.io/launch-orbit-chain/how-tos/orbit-sdk-deploying-rollup-chain)
