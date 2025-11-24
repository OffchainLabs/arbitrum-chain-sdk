# Arbitrum Chain SDK

## Setup fee routing for Orbit chains settling to non-Arbitrum chains (including Ethereum)

This example script shows how to setup the appropriate fee routing to comply with the [Arbitrum Expansion Program](https://forum.arbitrum.foundation/t/the-arbitrum-expansion-program-and-developer-guild/20722) requirement of sharing 10% of the revenue back to the Arbitrum ecosystem.

The script performs the following operations:

1. Obtain all chain contracts (needed to execute the next steps)
2. Obtain the current fee collectors of the chain: Orbit base fee collector, Orbit surplus fee collector, Parent chain surplus fee collector
3. Deploy the ChildToParentRouter contract, configured to send the amounts received to the appropriate address on the parent chain controlled by the Arbitrum Foundation
4. Deploy a RewardDistributor contract for each different fee collector account, configured to distribute 90% of the amounts received to the specified recipient address, and 10% to the ChildToParentRouter contract
5. Set each of the fee collectors to the RewardDistributor contracts

## Variables needed

- ROLLUP_ADDRESS: address of the Rollup contract
- CHAIN_OWNER_PRIVATE_KEY: private key of the account with executor privileges in the UpgradeExecutor admin contract for the chain
- ORBIT_CHAIN_ID: chain id of the Orbit chain
- ORBIT_CHAIN_RPC: RPC of the Orbit chain
- PARENT_CHAIN_ID: chain id of the parent chain (should be a non-Arbitrum chain)
- PARENT_CHAIN_TARGET_ADDRESS: address on the parent chain where 10% of the revenue will be sent to (more information below)
- INFRA_FEE_DISTRIBUTOR_RECIPIENT: address to receive 90% of infrastructure fees
- NETWORK_FEE_DISTRIBUTOR_RECIPIENT: address to receive 90% of network fees
- L1_REWARD_DISTRIBUTOR_RECIPIENT: address to receive 90% of L1 rewards

### What PARENT_CHAIN_TARGET_ADDRESS to use

When executing this script, the RewardDistributor contract will be configured to send 10% of the funds received (10% of the revenue of the chain) to the address specified in PARENT_CHAIN_TARGET_ADDRESS, in the parent chain.

For L2 Orbit chains settling to Ethereum, this variable should be the multisig wallet owned by the Arbitrum Foundation that lives on Ethereum, which will eventually route the collected fees to the Arbitrum DAO Treasury Timelock contract on Arbitrum One.

L3 chains (or further layers) might need to specify a different target address on the parent chain depending on the gas token of the chain. If the chain uses ETH as the gas token, and a `ChildToParentRouter` contract is deployed in the parent chain, they can route their funds to that contract. If the chain uses a different gas token, please contact the Arbitrum Foundation to confirm the target address to withdraw the AEP fees to.

Routing contracts owned by the Arbitrum Foundation can be seen in the [AEP documentation](https://docs.arbitrum.io/launch-arbitrum-chain/configure-your-chain/advanced-configurations/aep-fee-router/aep-fee-router-introduction).

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

## References

- [Arbitrum Expansion Program governance forum post](https://forum.arbitrum.foundation/t/the-arbitrum-expansion-program-and-developer-guild/20722)
- [ChildToParentRouter contract](https://github.com/OffchainLabs/fund-distribution-contracts/blob/main/src/FeeRouter/ChildToParentRewardRouter.sol)
- [RewardDistributor contract](https://github.com/OffchainLabs/fund-distribution-contracts/blob/main/src/RewardDistributor.sol)
