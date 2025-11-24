import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { config } from 'dotenv';
import { getBridgeUiConfig } from '@arbitrum/chain-sdk';
import { writeFile } from 'fs/promises';
config();

async function main() {
  try {
    // use the arbitrumSepolia chain as parent chain
    const parentChain = arbitrumSepolia;

    // get the deployment transaction hash from the environment variables
    const txHash = process.env.ORBIT_DEPLOYMENT_TRANSACTION_HASH as `0x${string}`;

    // create a public client for the parent chain
    const parentChainPublicClient = createPublicClient({
      chain: parentChain,
      transport: http(),
    });

    // get the bridge UI info
    const bridgeUiInfo = await getBridgeUiConfig({
      params: {
        parentChain,
        deploymentTxHash: txHash,
        chainName: process.env.ORBIT_CHAIN_NAME || 'My Orbit Chain2',
        rpcUrl: process.env.ORBIT_CHAIN_RPC || 'http://localhost:8449',
        explorerUrl: process.env.ORBIT_CHAIN_EXPLORER_URL || 'http://localhost',
      },
      parentChainPublicClient,
    });

    // write the bridge UI info to output.json file
    await writeFile('output.json', JSON.stringify(bridgeUiInfo, null, 2));
    console.log('Bridge UI info has been written to output.json');
  } catch (error) {
    console.error('Error generating chain info:', error);
  }
}

main().catch(console.error);
