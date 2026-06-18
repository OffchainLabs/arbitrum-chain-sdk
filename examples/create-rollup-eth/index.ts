import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import {
  prepareChainConfig,
  createRollupPrepareDeploymentParamsConfig,
  createRollup,
} from '@arbitrum/chain-sdk';
import { sanitizePrivateKey, generateChainId } from '@arbitrum/chain-sdk/utils';
import { config } from 'dotenv';
config();

function withFallbackPrivateKey(privateKey: string | undefined): `0x${string}` {
  if (typeof privateKey === 'undefined' || privateKey === '') {
    return generatePrivateKey();
  }

  return sanitizePrivateKey(privateKey);
}

if (typeof process.env.DEPLOYER_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "DEPLOYER_PRIVATE_KEY" environment variable`);
}

if (typeof process.env.PARENT_CHAIN_RPC === 'undefined' || process.env.PARENT_CHAIN_RPC === '') {
  console.warn(
    `Warning: you may encounter timeout errors while running the script with the default rpc endpoint. Please provide the "PARENT_CHAIN_RPC" environment variable instead.`,
  );
}

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
const deployer = privateKeyToAccount(sanitizePrivateKey(process.env.DEPLOYER_PRIVATE_KEY));

async function main() {
  // generate a random chain id
  const chainId = generateChainId();

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

  try {
    await createRollup({
      params: {
        config: createRollupConfig,
        batchPosters: [batchPoster],
        validators: [validator],
      },
      account: deployer,
      parentChainPublicClient,
    });
  } catch (error) {
    console.error(`Rollup creation failed with error: ${error}`);
  }
}

main();
