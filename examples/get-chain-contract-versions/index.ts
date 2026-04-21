import { config } from 'dotenv';
import { getOrbitChainContractVersions } from '@arbitrum/chain-sdk';
import { isAddress } from 'viem';

config();

const inboxAddress = process.env.INBOX_ADDRESS;
const parentChainRpc = process.env.PARENT_CHAIN_RPC;
const executionMode = process.env.EXECUTION_MODE === 'docker' ? 'docker' : 'native';
const orbitActionsImage = process.env.ORBIT_ACTIONS_IMAGE;

async function main() {
  if (!inboxAddress || !isAddress(inboxAddress)) {
    throw new Error('Please provide a valid "INBOX_ADDRESS" environment variable');
  }

  if (!parentChainRpc) {
    throw new Error('Please provide the "PARENT_CHAIN_RPC" environment variable');
  }

  console.log('Getting Orbit chain contract versions...');
  const result = await getOrbitChainContractVersions(
    inboxAddress,
    parentChainRpc,
    executionMode,
    orbitActionsImage,
  );

  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
