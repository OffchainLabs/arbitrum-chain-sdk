import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseAbi,
  getAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  feeRouterDeployRewardDistributor,
  createRollupFetchCoreContracts,
  createTokenBridgeFetchTokenBridgeContracts,
  arbOwnerPublicActions,
} from '@arbitrum/chain-sdk';
import { getParentChainFromId, sanitizePrivateKey } from '@arbitrum/chain-sdk/utils';
import { config } from 'dotenv';
config();

// environent variables check
if (
  typeof process.env.ROLLUP_ADDRESS === 'undefined' ||
  typeof process.env.CHAIN_OWNER_PRIVATE_KEY === 'undefined' ||
  typeof process.env.ORBIT_CHAIN_ID === 'undefined' ||
  typeof process.env.ORBIT_CHAIN_RPC === 'undefined' ||
  typeof process.env.PARENT_CHAIN_ID === 'undefined' ||
  typeof process.env.RECIPIENT_ADDRESSES === 'undefined' ||
  typeof process.env.RECIPIENT_WEIGHTS === 'undefined'
) {
  throw new Error(
    `Please provide the following environment variables: ROLLUP_ADDRESS, CHAIN_OWNER_PRIVATE_KEY, ORBIT_CHAIN_ID, ORBIT_CHAIN_RPC, PARENT_CHAIN_ID, RECIPIENT_ADDRESSES, RECIPIENT_WEIGHTS.`,
  );
}

// load the chain owner account (or any account that has the executor role in the UpgradeExecutor)
const chainOwner = privateKeyToAccount(sanitizePrivateKey(process.env.CHAIN_OWNER_PRIVATE_KEY));

// set the parent chain and create a public client for it
const parentChain = getParentChainFromId(Number(process.env.PARENT_CHAIN_ID));
const parentChainPublicClient = createPublicClient({
  chain: parentChain,
  transport: http(),
});

// define chain config for the orbit chain
const orbitChain = defineChain({
  id: Number(process.env.ORBIT_CHAIN_ID),
  network: 'Orbit chain',
  name: 'orbit',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.ORBIT_CHAIN_RPC],
    },
    public: {
      http: [process.env.ORBIT_CHAIN_RPC],
    },
  },
  testnet: true,
});
const orbitChainPublicClient = createPublicClient({ chain: orbitChain, transport: http() }).extend(
  arbOwnerPublicActions,
);
const orbitChainWalletClient = createWalletClient({
  chain: orbitChain,
  transport: http(),
  account: chainOwner,
});

async function main() {
  // Step 0. Collect information
  // (We need to obtain the upgrade executor contract for setting the fee collector in the last step)
  // ---------------------------

  // getting all chain contracts
  const rollupCoreContracts = await createRollupFetchCoreContracts({
    rollup: process.env.ROLLUP_ADDRESS as `0x${string}`,
    publicClient: parentChainPublicClient,
  });

  const inbox = await parentChainPublicClient.readContract({
    address: rollupCoreContracts.rollup,
    abi: parseAbi(['function inbox() view returns (address)']),
    functionName: 'inbox',
  });
  const tokenBridgeContracts = await createTokenBridgeFetchTokenBridgeContracts({
    inbox,
    parentChainPublicClient,
  });

  // Step 1. Define the recipients of the fees
  //
  // The RewardDistributor contract will distribute the amounts received among the recipients configured here,
  // based on the weight of each recipient. For example, if one recipient has a weight of 75%, they will receive
  // 75% of the amount held in the contract at the time of distribution.
  //
  // Weights are expressed in percentages multiplied by 100. For example, to allocate 12,5% of the amount to
  // a specific recipient, you'll define the weight as 1250. To allocate 80%, you'll define the weight as 8000.
  //
  // You can configure as many recipients as you wish in the .env file
  // ---------------------------
  const recipientAddresses = JSON.parse(process.env.RECIPIENT_ADDRESSES!);
  const recipientWeights = JSON.parse(process.env.RECIPIENT_WEIGHTS!);

  if (recipientAddresses.length != recipientWeights.length) {
    throw new Error(
      `Env variables RECIPIENT_ADDRESSES and RECIPIENT_WEIGHTS must have the same length.`,
    );
  }

  const recipients = recipientAddresses.map((address: `0x${string}`, index: number) => ({
    account: address as `0x${string}`,
    weight: BigInt(recipientWeights[index]),
  }));

  // Step 2. Deploy the RewardDistributor
  //
  // This contract will distribute the amounts received by the contract to the configured recipients
  // ------------------------------------
  console.log('Deploying RewardDistributor contract...');
  const rewardDistributorDeploymentTransactionHash = await feeRouterDeployRewardDistributor({
    orbitChainWalletClient,
    recipients,
  });

  const rewardDistributorDeploymentTransactionReceipt =
    await orbitChainPublicClient.waitForTransactionReceipt({
      hash: rewardDistributorDeploymentTransactionHash,
    });

  if (!rewardDistributorDeploymentTransactionReceipt.contractAddress) {
    throw new Error('RewardDistributor was not successfully deployed.');
  }

  const rewardDistributorAddress = getAddress(
    rewardDistributorDeploymentTransactionReceipt.contractAddress,
  );
  console.log(`RewardDistributor contract deployed at ${rewardDistributorAddress}`);
  console.log('');

  // Step 3. Set the appropriate fee collector account to the RewardDistributor
  //
  // In this example, we will set the infraFeeAccount (the account that receives the fees corresponding to
  // the Orbit chain's execution gas)
  //
  // However, you can set the RewardDistributor as the collector of any of the fee types. You can find more
  // information about the different fee collectors in [How to manage fee collectors](https://docs.arbitrum.io/launch-orbit-chain/how-tos/manage-fee-collectors)
  // --------------------------------------------------------------------------
  console.log(
    'Setting the RewardDistributor as the collector of the Orbit chain execution fees...',
  );
  const setFeeCollectorTransactionRequest =
    await orbitChainPublicClient.arbOwnerPrepareTransactionRequest({
      functionName: 'setInfraFeeAccount',
      args: [rewardDistributorAddress],
      upgradeExecutor: tokenBridgeContracts.orbitChainContracts.upgradeExecutor,
      account: chainOwner.address,
    });

  await orbitChainPublicClient.sendRawTransaction({
    serializedTransaction: await chainOwner.signTransaction(setFeeCollectorTransactionRequest),
  });

  // checking that the fee collector was correctly set
  const currentFeeCollector = await orbitChainPublicClient.arbOwnerReadContract({
    functionName: 'getInfraFeeAccount',
  });
  if (currentFeeCollector != rewardDistributorAddress) {
    throw new Error(`Fee collector was not correctly set. It is now set to ${currentFeeCollector}`);
  }
  console.log('Fee collector correctly set to the RewardDistributor contract');
}

main();
