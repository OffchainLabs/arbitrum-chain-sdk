import { Chain, createPublicClient, http, parseAbi, defineChain, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import {
  createRollupFetchTransactionHash,
  createRollupPrepareTransactionReceipt,
  upgradeExecutorFetchPrivilegedAccounts,
  upgradeExecutorPrepareAddExecutorTransactionRequest,
  createTokenBridgeFetchTokenBridgeContracts,
} from '@arbitrum/chain-sdk';
import { sanitizePrivateKey } from '@arbitrum/chain-sdk/utils';
import { config } from 'dotenv';
config();

function getBlockExplorerUrl(chain: Chain) {
  return chain.blockExplorers?.default.url;
}

if (typeof process.env.ROLLUP_OWNER_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_OWNER_PRIVATE_KEY" environment variable`);
}

if (typeof process.env.ROLLUP_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_ADDRESS" environment variable`);
}

if (typeof process.env.NEW_EXECUTOR_ACCOUNT_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "NEW_EXECUTOR_ACCOUNT_ADDRESS" environment variable`);
}

if (typeof process.env.ORBIT_CHAIN_ID === 'undefined') {
  throw new Error(`Please provide the "ORBIT_CHAIN_ID" environment variable`);
}

if (typeof process.env.ORBIT_CHAIN_RPC === 'undefined') {
  throw new Error(`Please provide the "ORBIT_CHAIN_RPC" environment variable`);
}

if (typeof process.env.PARENT_CHAIN_RPC === 'undefined' || process.env.PARENT_CHAIN_RPC === '') {
  console.warn(
    `Warning: you may encounter timeout errors while running the script with the default rpc endpoint. Please provide the "PARENT_CHAIN_RPC" environment variable instead.`,
  );
}

// set the parent chain and create a public client for it
const parentChain = arbitrumSepolia;
const parentChainPublicClient = createPublicClient({
  chain: parentChain,
  transport: http(process.env.PARENT_CHAIN_RPC),
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
const orbitChainPublicClient = createPublicClient({ chain: orbitChain, transport: http() });

// load the deployer account
const deployer = privateKeyToAccount(sanitizePrivateKey(process.env.ROLLUP_OWNER_PRIVATE_KEY));

// calculating the executor role hash
const UPGRADE_EXECUTOR_ROLE_EXECUTOR = keccak256(toHex('EXECUTOR_ROLE'));

async function main() {
  //
  // Parent chain
  // ------------
  //
  // get the core contracts
  console.log('Fetching UpgradeExecutor address in the parent chain...');
  const transactionHash = await createRollupFetchTransactionHash({
    rollup: process.env.ROLLUP_ADDRESS as `0x${string}`,
    publicClient: parentChainPublicClient,
  });
  const transactionReceipt = createRollupPrepareTransactionReceipt(
    await parentChainPublicClient.getTransactionReceipt({ hash: transactionHash }),
  );
  const coreContracts = transactionReceipt.getCoreContracts();
  console.log(`UpgradeExecutor address: ${coreContracts.upgradeExecutor}`);

  // prepare the transaction to add the executor role in the parent chain
  const newExecutorAccountAddress = process.env.NEW_EXECUTOR_ACCOUNT_ADDRESS as `0x${string}`;
  console.log(
    `Adding ${newExecutorAccountAddress} as new account with executor role in the parent chain (${UPGRADE_EXECUTOR_ROLE_EXECUTOR})`,
  );
  const addExecutorTransactionRequest = await upgradeExecutorPrepareAddExecutorTransactionRequest({
    account: newExecutorAccountAddress,
    upgradeExecutorAddress: coreContracts.upgradeExecutor,
    executorAccountAddress: deployer.address,
    publicClient: parentChainPublicClient,
  });

  // sign and send the transaction
  const addExecutorTransactionHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await deployer.signTransaction(addExecutorTransactionRequest),
  });

  // wait for transaction receipt
  const addExecutorTransactionReceipt = await parentChainPublicClient.waitForTransactionReceipt({
    hash: addExecutorTransactionHash,
  });
  console.log(
    `New executor account added in ${getBlockExplorerUrl(parentChain)}/tx/${
      addExecutorTransactionReceipt.transactionHash
    }`,
  );

  // verify that the account has been added to the list of privileged accounts
  console.log('Fetching current privileged accounts in the parent chain...');
  const privilegedAccounts = await upgradeExecutorFetchPrivilegedAccounts({
    upgradeExecutorAddress: coreContracts.upgradeExecutor,
    publicClient: parentChainPublicClient,
  });
  console.log(privilegedAccounts);

  //
  // Orbit chain
  // -----------
  //
  // get the token bridge contracts (including the UpgradeExecutor)
  console.log('Fetching UpgradeExecutor address in the orbit chain...');
  const inbox = await parentChainPublicClient.readContract({
    address: process.env.ROLLUP_ADDRESS as `0x${string}`,
    abi: parseAbi(['function inbox() view returns (address)']),
    functionName: 'inbox',
  });
  const tokenBridgeContracts = await createTokenBridgeFetchTokenBridgeContracts({
    inbox,
    parentChainPublicClient,
  });
  const orbitChainUpgradeExecutor = tokenBridgeContracts.orbitChainContracts.upgradeExecutor;
  console.log(`UpgradeExecutor address: ${orbitChainUpgradeExecutor}`);

  // prepare the transaction to add the executor role in the orbit chain
  console.log(
    `Adding ${newExecutorAccountAddress} as new account with executor role in the Orbit chain (${UPGRADE_EXECUTOR_ROLE_EXECUTOR})`,
  );
  const addExecutorTransactionRequestOnOrbitChain =
    await upgradeExecutorPrepareAddExecutorTransactionRequest({
      account: newExecutorAccountAddress,
      upgradeExecutorAddress: orbitChainUpgradeExecutor,
      executorAccountAddress: deployer.address,
      publicClient: orbitChainPublicClient,
    });

  // sign and send the transaction
  const addExecutorTransactionHashOnOrbitChain = await orbitChainPublicClient.sendRawTransaction({
    serializedTransaction: await deployer.signTransaction(
      addExecutorTransactionRequestOnOrbitChain,
    ),
  });

  // wait for transaction receipt
  const addExecutorTransactionReceiptOnOrbitChain =
    await orbitChainPublicClient.waitForTransactionReceipt({
      hash: addExecutorTransactionHashOnOrbitChain,
    });
  console.log(
    `New executor account added in ${getBlockExplorerUrl(orbitChain)}/tx/${
      addExecutorTransactionReceiptOnOrbitChain.transactionHash
    }`,
  );

  // verify that the account has been added to the list of privileged accounts
  console.log('Fetching current privileged accounts in the Orbit chain...');
  const privilegedAccountsOnOrbitChain = await upgradeExecutorFetchPrivilegedAccounts({
    upgradeExecutorAddress: orbitChainUpgradeExecutor,
    publicClient: orbitChainPublicClient,
  });
  console.log(privilegedAccountsOnOrbitChain);
}

main();
