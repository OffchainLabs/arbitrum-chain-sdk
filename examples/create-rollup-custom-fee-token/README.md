# Arbitrum Chain SDK

## Deploying a rollup using a custom token as gas token

This is an example for deploying the rollup contracts for your Orbit chain to its parent chain.

```typescript
// set the custom fee token
const nativeToken: Address = process.env.CUSTOM_FEE_TOKEN_ADDRESS as `0x${string}`;

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
    nativeToken,
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

[Read full documentation](https://docs.arbitrum.io/launch-orbit-chain/how-tos/orbit-sdk-deploying-custom-gas-token-chain)
