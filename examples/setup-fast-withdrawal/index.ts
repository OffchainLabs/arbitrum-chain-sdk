import { Chain, createPublicClient, http, isAddress, Address, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createRollupFetchTransactionHash,
  createRollupPrepareTransactionReceipt,
  createSafePrepareTransactionReceipt,
  createSafePrepareTransactionRequest,
  rollupAdminLogicPublicActions,
  setAnyTrustFastConfirmerPrepareTransactionRequest,
} from '@arbitrum/chain-sdk';
import { sanitizePrivateKey, getParentChainFromId } from '@arbitrum/chain-sdk/utils';
import { base, baseSepolia } from '@arbitrum/chain-sdk/chains';
import { config } from 'dotenv';
config();

// helper functions
function getBlockExplorerUrl(chain: Chain) {
  return chain.blockExplorers?.default.url;
}

function getTimeDelayFromNumberOfBlocks(chainId: number, blocks: bigint): string {
  // For Arbitrum L2s built on top of Ethereum, or Arbitrum L3s built on top of an Arbitrum L2, `block.number` always returns the L1 block number.
  // L1 blocks are produced every 12 seconds.
  //
  // For Arbitrum L3s built on top of an OP Stack L2, `block.number` will return the L2 block number.
  // L2 blocks in OP Stack chains are produced every 2 seconds.
  const seconds = Number(
    chainId === base.id || chainId === baseSepolia.id ? blocks * 2n : blocks * 12n,
  );

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h${m}m${s}s`;
}

// check environment variables
if (typeof process.env.CHAIN_OWNER_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "CHAIN_OWNER_PRIVATE_KEY" environment variable`);
}

if (typeof process.env.PARENT_CHAIN_ID === 'undefined') {
  throw new Error(`Please provide the "PARENT_CHAIN_ID" environment variable`);
}

if (typeof process.env.ROLLUP_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_ADDRESS" environment variable`);
}

if (typeof process.env.FC_VALIDATORS === 'undefined') {
  throw new Error(`Please provide the "FC_VALIDATORS" environment variable`);
}

// rollup address
const rollupAddress = process.env.ROLLUP_ADDRESS as Address;

// set the parent chain and create a public client for it
const parentChain = getParentChainFromId(Number(process.env.PARENT_CHAIN_ID));
const parentChainPublicClient = createPublicClient({
  chain: parentChain,
  transport: http(),
}).extend(
  rollupAdminLogicPublicActions({
    rollup: rollupAddress,
  }),
);

// load the deployer account
const safeOwner = privateKeyToAccount(sanitizePrivateKey(process.env.CHAIN_OWNER_PRIVATE_KEY));

// sanitize validator addresses
const fcValidators = JSON.parse(process.env.FC_VALIDATORS);
const safeWalletThreshold = fcValidators.length;
if (!fcValidators) {
  throw new Error(`The "FC_VALIDATORS" environment variable must be a valid array`);
}

const sanitizedFcValidators = [
  ...new Set(
    fcValidators.filter((validator: `0x${string}`) =>
      isAddress(validator) ? validator : undefined,
    ),
  ),
];
if (sanitizedFcValidators.length !== safeWalletThreshold) {
  throw new Error(
    `Some of the addresses in the "FC_VALIDATORS" environment variable appear to not be valid or duplicated.`,
  );
}

// minimum assertion period
// (not required, by setting a default)
const minimumAssertionPeriod = BigInt(process.env.MINIMUM_ASSERTION_PERIOD || 75);

async function main() {
  //
  // Step 0. Gather necessary data (UpgradeExecutor address)
  //
  const transactionHash = await createRollupFetchTransactionHash({
    rollup: rollupAddress,
    publicClient: parentChainPublicClient,
  });
  const transactionReceipt = createRollupPrepareTransactionReceipt(
    await parentChainPublicClient.getTransactionReceipt({ hash: transactionHash }),
  );
  const coreContracts = transactionReceipt.getCoreContracts();
  const upgradeExecutorAddress = coreContracts.upgradeExecutor;

  //
  // Step 1. Create Safe multisig
  //
  console.log(
    `Step 1: Create a new ${safeWalletThreshold}/${safeWalletThreshold} Safe wallet with the following addresses as signers:`,
    fcValidators,
  );
  console.log('---');

  const txRequest = await createSafePrepareTransactionRequest({
    publicClient: parentChainPublicClient,
    account: safeOwner,
    owners: fcValidators,
    threshold: safeWalletThreshold,
    saltNonce: BigInt(Date.now()),
  });

  // sign and send the transaction
  const txHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await safeOwner.signTransaction(txRequest),
  });

  // get the transaction receipt after waiting for the transaction to complete
  const txReceipt = createSafePrepareTransactionReceipt(
    await parentChainPublicClient.waitForTransactionReceipt({ hash: txHash }),
  );

  // get the safe address
  const safeAddress = txReceipt.getSafeContract();

  console.log(
    `Safe wallet (${safeAddress}) deployed in transaction ${getBlockExplorerUrl(parentChain)}/tx/${
      txReceipt.transactionHash
    }`,
  );
  console.log('');

  // add the new Safe address as a validator
  // (needed to call removeOldZombies() as part of the fastConfirmNextNode() flow)
  fcValidators.push(safeAddress);

  //
  // Step 2. Add validators to the Orbit chain rollup validator whitelist
  //
  console.log(
    `Step 2: Adding the following validators to the Rollup validator whitelist:`,
    fcValidators,
  );
  console.log('---');

  // prepare set validator transaction request
  const fcValidatorsStatus = Array(fcValidators.length).fill(true);
  const setValidatorTransactionRequest =
    await parentChainPublicClient.rollupAdminLogicPrepareTransactionRequest({
      functionName: 'setValidator',
      args: [
        fcValidators, // validator address list
        fcValidatorsStatus, // validator status list
      ],
      upgradeExecutor: upgradeExecutorAddress,
      account: safeOwner.address,
    });

  // sign and send the transaction
  const setValidatorTransactionHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await safeOwner.signTransaction(setValidatorTransactionRequest),
  });

  // wait for transaction receipt
  const setValidatorTransactionReceipt = await parentChainPublicClient.waitForTransactionReceipt({
    hash: setValidatorTransactionHash,
  });

  console.log(
    `New validators added in ${getBlockExplorerUrl(parentChain)}/tx/${
      setValidatorTransactionReceipt.transactionHash
    }`,
  );
  console.log('');

  //
  // Step 3. Configure the multisig address as the `anyTrustFastConfirmer` on the rollup contract using `setAnyTrustFastConfirmer`
  //
  console.log(
    `Step 3: Configure the multisig address as the anyTrustFastConfirmer : ${safeAddress}`,
  );
  console.log('---');

  // get current anyTrustFastConfirmer
  const currentAnyTrustFastConfirmer = await parentChainPublicClient.readContract({
    address: rollupAddress,
    abi: parseAbi(['function anyTrustFastConfirmer() view returns (address)']),
    functionName: 'anyTrustFastConfirmer',
  });

  if (currentAnyTrustFastConfirmer.toLowerCase() !== safeAddress.toLowerCase()) {
    // prepare transaction
    const setAnyTrustFastConfirmerTransactionRequest =
      await setAnyTrustFastConfirmerPrepareTransactionRequest({
        publicClient: parentChainPublicClient,
        account: safeOwner,
        rollup: rollupAddress,
        upgradeExecutor: upgradeExecutorAddress,
        fastConfirmer: safeAddress,
      });

    // sign and send the transaction
    const setAnyTrustFastConfirmerTransactionHash =
      await parentChainPublicClient.sendRawTransaction({
        serializedTransaction: await safeOwner.signTransaction(
          setAnyTrustFastConfirmerTransactionRequest,
        ),
      });

    // wait for transaction receipt
    const setAnyTrustFastConfirmerTransactionReceipt =
      await parentChainPublicClient.waitForTransactionReceipt({
        hash: setAnyTrustFastConfirmerTransactionHash,
      });

    console.log(
      `New AnyTrust fast confirmer set in ${getBlockExplorerUrl(parentChain)}/tx/${
        setAnyTrustFastConfirmerTransactionReceipt.transactionHash
      }`,
    );
  } else {
    console.log(
      `AnyTrust fast confirmer is already configured to ${currentAnyTrustFastConfirmer}. Skipping.`,
    );
  }
  console.log('');

  //
  // Step 4. Configure `minimumAssertionPeriod` on the rollup contract using `setMinimumAssertionPeriod`
  //
  console.log(
    `Step 4: Configure the minimumAssertionPeriod in the Rollup contract to: ${Number(
      minimumAssertionPeriod,
    )}`,
  );
  console.log('---');

  // get current minimumAssertionPeriod
  const currentMinimumAssertionPeriod = await parentChainPublicClient.rollupAdminLogicReadContract({
    functionName: 'minimumAssertionPeriod',
  });

  if (currentMinimumAssertionPeriod !== minimumAssertionPeriod) {
    // prepare setMinimumAssertionPeriod transaction request
    const setMinimumAssertionPeriodTransactionRequest =
      await parentChainPublicClient.rollupAdminLogicPrepareTransactionRequest({
        functionName: 'setMinimumAssertionPeriod',
        args: [minimumAssertionPeriod],
        upgradeExecutor: upgradeExecutorAddress,
        account: safeOwner.address,
      });

    // sign and send the transaction
    const setMinimumAssertionPeriodTransactionHash =
      await parentChainPublicClient.sendRawTransaction({
        serializedTransaction: await safeOwner.signTransaction(
          setMinimumAssertionPeriodTransactionRequest,
        ),
      });

    // wait for transaction receipt
    const setMinimumAssertionPeriodTransactionReceipt =
      await parentChainPublicClient.waitForTransactionReceipt({
        hash: setMinimumAssertionPeriodTransactionHash,
      });

    console.log(
      `Minimum assertion period set in ${getBlockExplorerUrl(parentChain)}/tx/${
        setMinimumAssertionPeriodTransactionReceipt.transactionHash
      }`,
    );
  } else {
    console.log(
      `Minimum assertion period is already configured to ${currentMinimumAssertionPeriod}. Skipping.`,
    );
  }
  console.log('');

  //
  // Step 5. Show a confirmation message with the next steps
  //
  console.log(`Step 5: Configure your batch poster and your validator nodes`);
  console.log(`---`);
  console.log(
    'Your chain is now configured with a fast-withdrawal committee. The following instructions show how to configure your batch poster and your validators to start using this feature.',
  );
  console.log('');

  // Batch poster configuration
  const timeDelay = getTimeDelayFromNumberOfBlocks(parentChain.id, minimumAssertionPeriod);
  console.log('Your batch poster has to run at least nitro v3.1.2');
  console.log('Add the following parameter:');
  console.log(`--node.batch-poster.max-delay=${timeDelay}`);
  console.log('');

  // Validator configuration
  console.log('Your validators have to run at least nitro v3.1.2');
  console.log('Add the following parameters:');
  console.log(`--node.staker.enable-fast-confirmation=true`);
  console.log(`--node.staker.make-assertion-interval=${timeDelay}`);
  console.log('');

  // Final recommendation
  console.log('Finally, restart your batch poster and validator nodes.');
}

main();
