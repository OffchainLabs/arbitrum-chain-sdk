import { config } from 'dotenv';
import { getNitroContractVersions } from '@arbitrum/chain-sdk';
import { isAddress } from 'viem';

config();

const inboxAddress = process.env.INBOX_ADDRESS;
const parentChainRpc = process.env.PARENT_CHAIN_RPC;

async function main() {
  if (!inboxAddress || !isAddress(inboxAddress)) {
    throw new Error('Please provide a valid "INBOX_ADDRESS" environment variable');
  }

  if (!parentChainRpc) {
    throw new Error('Please provide the "PARENT_CHAIN_RPC" environment variable');
  }

  console.log('Getting Nitro contract versions...');
  const result = await getNitroContractVersions(inboxAddress, parentChainRpc);

  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
