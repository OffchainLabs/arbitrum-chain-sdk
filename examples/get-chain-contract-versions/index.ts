import { config } from 'dotenv';
import { getOrbitChainContractVersions } from '@arbitrum/chain-sdk';
import { isAddress, Address } from 'viem';

config();

const orbitActionsImage = process.env.ORBIT_ACTIONS_IMAGE ?? 'offchainlabs/chain-actions';
const network = process.env.NETWORK ?? 'arb1';
const inboxAddress = process.env.INBOX_ADDRESS;
const parentChainRpc = process.env.PARENT_CHAIN_RPC;

if (!inboxAddress || !isAddress(inboxAddress)) {
  throw new Error('Please provide the "INBOX_ADDRESS" environment variable');
}

if (!parentChainRpc || parentChainRpc === '') {
  throw new Error('Please provide the "PARENT_CHAIN_RPC" environment variable');
}

async function main() {
  console.log('Getting Orbit chain contract versions...');
  const result = await getOrbitChainContractVersions({
    image: orbitActionsImage,
    inboxAddress: inboxAddress as Address,
    network,
    env: {
      PARENT_CHAIN_RPC: parentChainRpc,
    },
  });

  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
