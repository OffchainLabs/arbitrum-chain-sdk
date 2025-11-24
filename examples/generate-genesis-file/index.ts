import { Address, createPublicClient, http, toHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { createRollupPrepareDeploymentParamsConfig, createRollup } from '@arbitrum/orbit-sdk';
import { sanitizePrivateKey } from '@arbitrum/orbit-sdk/utils';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { createInterface } from 'readline';
config();

// Env variables check
if (typeof process.env.NITRO_NODE_IMAGE === 'undefined') {
  throw new Error(`Please provide the "NITRO_NODE_IMAGE" environment variable`);
}
if (typeof process.env.L1_BASE_FEE === 'undefined') {
  throw new Error(`Please provide the "L1_BASE_FEE" environment variable`);
}
const nitroNodeImage = process.env.NITRO_NODE_IMAGE;
const l1BaseFee = Number(process.env.L1_BASE_FEE);

// Optional checks when creating a rollup
if (process.env.CREATE_ROLLUP === 'true') {
  // Check environment variables
  if (typeof process.env.DEPLOYER_PRIVATE_KEY === 'undefined') {
    throw new Error(`Please provide the "DEPLOYER_PRIVATE_KEY" environment variable`);
  }

  if (typeof process.env.PARENT_CHAIN_RPC === 'undefined' || process.env.PARENT_CHAIN_RPC === '') {
    console.warn(
      `Warning: you may encounter timeout errors while running the script with the default rpc endpoint. Please provide the "PARENT_CHAIN_RPC" environment variable instead.`,
    );
  }
}

// Helpers
function withFallbackPrivateKey(privateKey: string | undefined): `0x${string}` {
  if (typeof privateKey === 'undefined' || privateKey === '') {
    return generatePrivateKey();
  }

  return sanitizePrivateKey(privateKey);
}

async function askQuestion(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    }),
  );
}

async function main() {
  // Step 0 - Check if there's a genesis.json file present in the directory
  let generateGenesisFile = true;
  if (fs.existsSync('genesis.json')) {
    // Ask the user if they want to overwrite the existing file
    const generateGenesisuserResponse = await askQuestion(
      'A genesis.json file already exists in the current directory. Do you want to overwrite it? (y/n): ',
    );
    if (generateGenesisuserResponse.toLowerCase() !== 'y') {
      generateGenesisFile = false;
      console.log('Using existing genesis.json file.');
    }
  }

  // Step 1 - If needed, generate the genesis file
  // Note: remove this step once we have a public image
  if (generateGenesisFile) {
    // Build genesis file generator container from Github
    console.log(`Build genesis file generator container...`);
    execSync(
      `docker build -t genesis-file-generator https://github.com/OffchainLabs/genesis-file-generator.git`,
    );

    // Generate genesis file
    console.log(`Generate genesis file...`);
    execSync(`docker run --env-file ./.env genesis-file-generator > genesis.json`);
  }

  // Step 2 - Obtain genesis block hash and sendRoot hash
  console.log(`Obtain genesis block hash and sendRoot hash...`);
  console.log(`Using image "${nitroNodeImage}" and L1 base fee "${l1BaseFee}".`);
  const genesisHashes = execSync(
    `docker run -v $(pwd):/data/genesisDir --entrypoint genesis-generator ${nitroNodeImage} --genesis-json-file /data/genesisDir/genesis.json --initial-l1-base-fee ${l1BaseFee}`,
  );

  // Step 3 - Extract hashes and output results
  // genesisHashes has the following structure:
  // BlockHash: 0xabcd, SendRoot: 0x1234, Batch: 1, PosInBatch: 0
  const genesisHashesStr = genesisHashes.toString();
  const genesisBlockHash = genesisHashesStr.split(',')[0].split(':')[1].trim();
  const sendRootHash = genesisHashesStr.split(',')[1].split(':')[1].trim();

  console.log('');
  console.log('-------------------');
  console.log('Genesis information');
  console.log('-------------------');
  console.log('Genesis file generated: genesis.json');
  console.log(`Block hash: ${genesisBlockHash}`);
  console.log(`SendRoot hash: ${sendRootHash}`);

  // Step 4 - Create Rollup (optional)
  // Ask the user if they want to create a rollup
  const createRollupUserResponse = await askQuestion(
    'Do you want to continue creating the rollup with the current genesis.json file? (y/n)',
  );
  if (createRollupUserResponse.toLowerCase() === 'y') {
    // load or generate a random batch poster account
    const batchPosterPrivateKey = withFallbackPrivateKey(process.env.BATCH_POSTER_PRIVATE_KEY);
    const batchPoster = privateKeyToAccount(batchPosterPrivateKey).address;

    // load or generate a random validator account
    const validatorPrivateKey = withFallbackPrivateKey(process.env.VALIDATOR_PRIVATE_KEY);
    const validator = privateKeyToAccount(validatorPrivateKey).address;

    // set the parent chain and create a public client for it
    const parentChain = arbitrumSepolia;
    const parentChainPublicClient = createPublicClient({
      chain: parentChain,
      transport: http(process.env.PARENT_CHAIN_RPC),
    });

    // load the deployer account
    const deployer = privateKeyToAccount(sanitizePrivateKey(process.env.DEPLOYER_PRIVATE_KEY!));

    // The following env variables must exist, otherwise the genesis generation would have failed
    const chainId = Number(process.env.CHAIN_ID!);
    const chainOwner = process.env.CHAIN_OWNER as Address;

    // Load chain config from the genesis file
    let genesisFileContents: string;
    try {
      genesisFileContents = fs.readFileSync('genesis.json', { encoding: 'utf8' });
    } catch (err) {
      console.error('Failed to read generated genesis.json file');
      throw err;
    }
    const genesisConfiguration = JSON.parse(genesisFileContents);

    // Check whether or not we need to deploy the L2 factories (since they are included in the genesis file by default)
    const l2Factories = [
      // Arachnid's deterministic deployment proxy
      '0x4e59b44847b379578588920cA78FbF26c0B4956C',
      // Zoltu's deterministic deployment proxy
      '0x7A0D94F55792C434d74a40883C6ed8545E406D12',
      // ERC-2470 Singleton Factory
      '0xce0042B868300000d44A59004Da54A005ffdcf9f',
      // ERC-1820: Pseudo-introspection Registry Contract
      '0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24',
    ] as const;

    const allocKeys = new Set(
      Object.keys(genesisConfiguration.alloc ?? {}).map((k) => k.toLowerCase()),
    );
    const hasAllFactories = l2Factories.every((a) => allocKeys.has(a.toLowerCase()));

    // Prepare the genesis assertion state
    const genesisAssertionState = {
      globalState: {
        bytes32Vals: [genesisBlockHash as `0x${string}`, sendRootHash as `0x${string}`] as [
          `0x${string}`,
          `0x${string}`,
        ],
        // Set inbox position to 1
        u64Vals: [1n, 0n] as [bigint, bigint],
      },
      machineStatus: 0, // Running
      endHistoryRoot: toHex(0, { size: 32 }),
    };

    console.log('');
    console.log('------------------');
    console.log('Creating Rollup...');
    console.log('------------------');
    const createRollupConfig = createRollupPrepareDeploymentParamsConfig(parentChainPublicClient, {
      chainId: BigInt(chainId),
      owner: chainOwner,
      chainConfig: genesisConfiguration.config,
      genesisAssertionState,
    });

    try {
      await createRollup({
        params: {
          config: createRollupConfig,
          batchPosters: [batchPoster],
          validators: [validator],
          deployFactoriesToL2: !hasAllFactories,
        },
        account: deployer,
        parentChainPublicClient,
      });
    } catch (error) {
      console.error(`Rollup creation failed with error: ${error}`);
    }
  }
}

main();
