# Setup a fast-withdrawal committee for your AnyTrust Orbit chain

This example script shows how to setup a fast-withdrawal committee for your AnyTrust Orbit chain.

## Rationale

Optimistic rollups must sustain a multi-day challenge period to allow time for fraud proofs. This delays finality for users and apps, resulting in multi-day withdrawal times and cross-chain communication delays.

Fast Withdrawals is a new configuration allowing Orbit chains to achieve fast finality. Orbit chains with Fast Withdrawals will have their transactions processed by a committee of validators. Transactions with a unanimous vote across the committee will have their state transition immediately confirmed.

This will allow:

- Orbit chains can configure a fast confirmation frequency (any time up to 15 minutes)
- User withdrawals to are confirmed on the parent chain at frequencies up to ~15 minutes
- Enhanced cross-chain communication by allowing cross-chain apps to read finalized state up to the fast confirmation frequency

## How it works

This script performs the following operations:

1. Create a new n/n Safe wallet with the specified validators as signers
2. Add the specified validators to the Rollup validators whitelist
3. Set the new Safe wallet as the anytrustFastConfirmer in the Rollup contract
4. Set the new minimumAssertionPeriod if needed
5. Show how to configure the batch poster and validator nodes

## Variables needed

You need to set the following environment variables in an .env file:

- CHAIN_OWNER_PRIVATE_KEY: private key of the account with executor privileges in the UpgradeExecutor admin contract for the chain. It will be the deployer of the multisig Safe wallet.
- PARENT_CHAIN_ID: chainId of the parent chain.
- ROLLUP_ADDRESS: address of the Rollup contract.
- FC_VALIDATORS: array of fast-withdrawal validators. They will be added as signers to the multisig Safe wallet, and will be added to the Rollup's validator whitelist.
- MINIMUM_ASSERTION_PERIOD: optional parameter. Minimum number of blocks that have to pass in between assertions (measured in L1 blocks).

## Setup

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Create .env file and add the env vars

   ```bash
   cp .env.example .env
   ```

3. Run the example
   ```bash
   pnpm dev
   ```
