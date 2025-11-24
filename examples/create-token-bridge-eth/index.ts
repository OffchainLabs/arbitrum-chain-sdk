import { Chain, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import {
  createTokenBridgePrepareSetWethGatewayTransactionReceipt,
  createTokenBridgePrepareSetWethGatewayTransactionRequest,
  createTokenBridgePrepareTransactionReceipt,
  createTokenBridgePrepareTransactionRequest,
} from '@arbitrum/chain-sdk';
import { sanitizePrivateKey } from '@arbitrum/chain-sdk/utils';
import { config } from 'dotenv';
config();

function getBlockExplorerUrl(chain: Chain) {
  return chain.blockExplorers?.default.url;
}

if (typeof process.env.ROLLUP_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_ADDRESS" environment variable`);
}

if (typeof process.env.ROLLUP_OWNER_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_OWNER_PRIVATE_KEY" environment variable`);
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

// load the rollup owner account
const rollupOwner = privateKeyToAccount(sanitizePrivateKey(process.env.ROLLUP_OWNER_PRIVATE_KEY));

async function main() {
  // prepare the transaction for creating the token bridge
  const txRequest = await createTokenBridgePrepareTransactionRequest({
    params: {
      rollup: process.env.ROLLUP_ADDRESS as `0x${string}`,
      rollupOwner: rollupOwner.address,
    },
    parentChainPublicClient,
    orbitChainPublicClient,
    account: rollupOwner.address,
    retryableGasOverrides: {
      maxSubmissionCostForFactory: { percentIncrease: 100n },
      maxGasForFactory: { percentIncrease: 100n },
      maxSubmissionCostForContracts: { percentIncrease: 100n },
      maxGasForContracts: { percentIncrease: 100n },
    },
  });

  // sign and send the transaction
  console.log(`Deploying the TokenBridge...`);
  const txHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await rollupOwner.signTransaction(txRequest),
  });

  // get the transaction receipt after waiting for the transaction to complete
  const txReceipt = createTokenBridgePrepareTransactionReceipt(
    await parentChainPublicClient.waitForTransactionReceipt({ hash: txHash }),
  );
  console.log(`Deployed in ${getBlockExplorerUrl(parentChain)}/tx/${txReceipt.transactionHash}`);

  // wait for retryables to execute
  console.log(`Waiting for retryable tickets to execute on the Orbit chain...`);
  const orbitChainRetryableReceipts = await txReceipt.waitForRetryables({
    orbitPublicClient: orbitChainPublicClient,
  });
  console.log(`Retryables executed`);
  console.log(
    `Transaction hash for first retryable is ${orbitChainRetryableReceipts[0].transactionHash}`,
  );
  console.log(
    `Transaction hash for second retryable is ${orbitChainRetryableReceipts[1].transactionHash}`,
  );
  if (orbitChainRetryableReceipts[0].status !== 'success') {
    throw new Error(
      `First retryable status is not success: ${orbitChainRetryableReceipts[0].status}. Aborting...`,
    );
  }
  if (orbitChainRetryableReceipts[1].status !== 'success') {
    throw new Error(
      `Second retryable status is not success: ${orbitChainRetryableReceipts[1].status}. Aborting...`,
    );
  }

  // fetching the TokenBridge contracts
  const tokenBridgeContracts = await txReceipt.getTokenBridgeContracts({
    parentChainPublicClient,
  });
  console.log(`TokenBridge contracts:`, tokenBridgeContracts);

  // verifying L2 contract existence
  const orbitChainRouterBytecode = await orbitChainPublicClient.getBytecode({
    address: tokenBridgeContracts.orbitChainContracts.router,
  });

  if (!orbitChainRouterBytecode || orbitChainRouterBytecode == '0x') {
    throw new Error(
      `TokenBridge deployment seems to have failed since orbit chain contracts do not have code`,
    );
  }

  // set weth gateway
  const setWethGatewayTxRequest = await createTokenBridgePrepareSetWethGatewayTransactionRequest({
    rollup: process.env.ROLLUP_ADDRESS as `0x${string}`,
    parentChainPublicClient,
    orbitChainPublicClient,
    account: rollupOwner.address,
    retryableGasOverrides: {
      gasLimit: {
        percentIncrease: 200n,
      },
    },
  });

  // sign and send the transaction
  const setWethGatewayTxHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await rollupOwner.signTransaction(setWethGatewayTxRequest),
  });

  // get the transaction receipt after waiting for the transaction to complete
  const setWethGatewayTxReceipt = createTokenBridgePrepareSetWethGatewayTransactionReceipt(
    await parentChainPublicClient.waitForTransactionReceipt({ hash: setWethGatewayTxHash }),
  );

  console.log(
    `Weth gateway set in ${getBlockExplorerUrl(parentChain)}/tx/${
      setWethGatewayTxReceipt.transactionHash
    }`,
  );

  // Wait for retryables to execute
  const orbitChainSetWethGatewayRetryableReceipt = await setWethGatewayTxReceipt.waitForRetryables({
    orbitPublicClient: orbitChainPublicClient,
  });
  console.log(`Retryables executed`);
  console.log(
    `Transaction hash for retryable is ${orbitChainSetWethGatewayRetryableReceipt[0].transactionHash}`,
  );
  if (orbitChainSetWethGatewayRetryableReceipt[0].status !== 'success') {
    throw new Error(
      `Retryable status is not success: ${orbitChainSetWethGatewayRetryableReceipt[0].status}. Aborting...`,
    );
  }
}

main();
