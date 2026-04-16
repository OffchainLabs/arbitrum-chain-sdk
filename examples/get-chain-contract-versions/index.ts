import { config } from 'dotenv';
import { getOrbitChainContractVersions } from '@arbitrum/chain-sdk';
import { isAddress, Address, createPublicClient, http } from 'viem';

config();

const inboxAddress = process.env.INBOX_ADDRESS;
const parentChainRpc = process.env.PARENT_CHAIN_RPC;

if (!inboxAddress || !isAddress(inboxAddress)) {
  throw new Error('Please provide the "INBOX_ADDRESS" environment variable');
}

if (!parentChainRpc || parentChainRpc === '') {
  throw new Error('Please provide the "PARENT_CHAIN_RPC" environment variable');
}

const parentChainRpcUrl = parentChainRpc;

async function main() {
  console.log('Getting Orbit chain contract versions...');
  const parentChainPublicClient = createPublicClient({
    transport: http(parentChainRpcUrl),
  });
  const parentChainId = await parentChainPublicClient.getChainId();
  const result = await getOrbitChainContractVersions({
    inboxAddress: inboxAddress as Address,
    networkOrChainId: parentChainId,
    parentChainRpc: parentChainRpcUrl,
  });

  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
