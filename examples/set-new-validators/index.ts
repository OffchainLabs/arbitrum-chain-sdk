import { Chain, createPublicClient, http, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import {
  createRollupFetchTransactionHash,
  createRollupPrepareTransactionReceipt,
  rollupAdminLogicPublicActions,
  // Uncomment it when you want to use getValidators() to get validator status
  // getValidators,
} from '@arbitrum/chain-sdk';
import { sanitizePrivateKey } from '@arbitrum/chain-sdk/utils';
import { config } from 'dotenv';
config();

if (typeof process.env.ROLLUP_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_ADDRESS" environment variable`);
}

if (typeof process.env.ROLLUP_OWNER_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "ROLLUP_OWNER_PRIVATE_KEY" environment variable`);
}

if (typeof process.env.NEW_VALIDATOR_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "NEW_VALIDATOR_ADDRESS" environment variable`);
}

if (typeof process.env.PARENT_CHAIN_RPC === 'undefined' || process.env.PARENT_CHAIN_RPC === '') {
  console.warn(
    `Warning: you may encounter timeout errors while running the script with the default rpc endpoint. Please provide the "PARENT_CHAIN_RPC" environment variable instead.`,
  );
}

function getBlockExplorerUrl(chain: Chain) {
  return chain.blockExplorers?.default.url;
}

// set the parent chain and create a public client for it
const parentChain = arbitrumSepolia;
const parentChainPublicClient = createPublicClient({
  chain: parentChain,
  transport: http(process.env.PARENT_CHAIN_RPC),
}).extend(
  rollupAdminLogicPublicActions({
    rollup: process.env.ROLLUP_ADDRESS as Address,
  }),
);

// load the deployer account
const deployer = privateKeyToAccount(sanitizePrivateKey(process.env.ROLLUP_OWNER_PRIVATE_KEY));

async function main() {
  //
  // Parent chain
  // ------------
  //
  // get the core contracts
  console.log('Fetching UpgradeExecutor address in the parent chain...');
  const transactionHash = await createRollupFetchTransactionHash({
    rollup: process.env.ROLLUP_ADDRESS as Address,
    publicClient: parentChainPublicClient,
  });
  const transactionReceipt = createRollupPrepareTransactionReceipt(
    await parentChainPublicClient.getTransactionReceipt({ hash: transactionHash }),
  );
  const coreContracts = transactionReceipt.getCoreContracts();
  console.log(`UpgradeExecutor address: ${coreContracts.upgradeExecutor}`);

  // here we just set one new validator, so the array length is 1
  const newValidators = [process.env.NEW_VALIDATOR_ADDRESS as Address];
  const newValidatorStatus = [true];

  // check the status of this address in validator list before executing
  const beforeStatus = await parentChainPublicClient.rollupAdminLogicReadContract({
    functionName: 'isValidator',
    args: [newValidators[0]],
  });
  console.log(
    `Before executing, the address ${newValidators[0]} status in validator list is ${beforeStatus}`,
  );

  /*
   You can also use the following code to check validator status, it will return a list 
   of whitelist validators.

   console.log('Fetching current validator address list in the parent chain...');
   const beforeValidatorList = await getValidators(parentChainPublicClient, {
    rollup: coreContracts.rollup,
   });
   console.log(`Before executing, the validator list is ${beforeValidatorList.validators}`);
  */

  // prepare set validator transaction request
  const setValidatorTransactionRequest =
    await parentChainPublicClient.rollupAdminLogicPrepareTransactionRequest({
      functionName: 'setValidator',
      args: [
        newValidators, // validator address list
        newValidatorStatus, // validator status list
      ],
      upgradeExecutor: coreContracts.upgradeExecutor,
      account: deployer.address,
    });

  // sign and send the transaction
  const setValidatorTransactionHash = await parentChainPublicClient.sendRawTransaction({
    serializedTransaction: await deployer.signTransaction(setValidatorTransactionRequest),
  });

  // wait for transaction receipt
  const setValidatorTransactionReceipt = await parentChainPublicClient.waitForTransactionReceipt({
    hash: setValidatorTransactionHash,
  });

  console.log(
    `New validator address set in ${getBlockExplorerUrl(parentChain)}/tx/${
      setValidatorTransactionReceipt.transactionHash
    }`,
  );

  // Check the status of this address in validator list before executing
  const afterStatus = await parentChainPublicClient.rollupAdminLogicReadContract({
    functionName: 'isValidator',
    args: [newValidators[0]],
    rollup: coreContracts.rollup,
  });

  console.log(
    `After executing, the address ${newValidators[0]} status in validator list is ${afterStatus}`,
  );
}

main();
