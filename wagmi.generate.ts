import { Plugin } from '@wagmi/cli';
import { Abi, hashMessage, createPublicClient, http, zeroAddress, Address } from 'viem';
import dotenv from 'dotenv';

import { ParentChainId } from './src';
import {
  arbitrumNova,
  arbitrumSepolia,
  nitroTestnodeL1,
  nitroTestnodeL2,
  nitroTestnodeL3,
  chains,
} from './src/chains';
import { getImplementation } from './src/utils/getImplementation';
import { getArbOSVersion } from './src/utils/getArbOSVersion';

dotenv.config();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const referenceChain = arbitrumSepolia;
const apiKey = process.env.ETHERSCAN_API_KEY;

if (!apiKey) {
  throw new Error('Missing the ETHERSCAN_API_KEY environment variable!');
}

export type ContractConfig = {
  name: string;
  version?: string;
  address: Record<ParentChainId, `0x${string}`> | `0x${string}`;
};

async function fetchAbi(chainId: ParentChainId, address: `0x${string}`) {
  if (chainId === arbitrumNova.id) {
    const response = await fetch(
      `https://arbitrum-nova.blockscout.com/api/v2/smart-contracts/${address}`,
    );
    const responseJson = await response.json();

    if (!response.ok || !responseJson.abi) {
      throw new Error(`Failed to fetch ABI for ${chainId}: ${responseJson.message}`);
    }

    return responseJson.abi;
  }

  const responseJson = await (
    await fetch(
      `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getabi&format=raw&address=${address}&apikey=${apiKey}`,
    )
  ).json();

  // sleep to avoid rate limiting
  await sleep(1_000);

  if (responseJson.message === 'NOTOK') {
    throw new Error(`Failed to fetch ABI for ${chainId}: ${responseJson.result}`);
  }

  return responseJson;
}

function allEqual<T>(array: T[]) {
  return array.every((value) => value === array[0]);
}

async function assertContractAbisMatch(contract: ContractConfig) {
  console.log(` (checking if ABIs match across all chains) `);

  const abiHashes = await Promise.all(
    Object.entries(contract.address)
      // don't fetch abis for testnode
      .filter(([_chainId]) => {
        const chainId = Number(_chainId);

        return (
          chainId !== nitroTestnodeL1.id &&
          chainId !== nitroTestnodeL2.id &&
          chainId !== nitroTestnodeL3.id
        );
      })
      // resolve implementations and fetch abis for all chains, then hash them
      .map(async ([_chainId, _address], index) => {
        const chainId = Number(_chainId) as ParentChainId;
        const address = _address as Address;

        // sleep to avoid rate limiting
        await sleep(index * 1_000);

        const client = createPublicClient({
          chain: chains.find((chain) => chain.id === chainId),
          transport: http(),
        });

        const implementation = await getImplementation({ client, address });
        const resolvedAddress = implementation !== zeroAddress ? implementation : address;

        const abi = await fetchAbi(chainId, resolvedAddress);
        const abiHash = hashMessage(JSON.stringify(abi));

        return abiHash;
      }),
  );

  // make sure all abis hashes are the same
  if (!allEqual(abiHashes)) {
    throw new Error(`ABI hashes for ${contract.name} do not match`);
  }
}

/**
 * Factory contracts (e.g., RollupCreator, TokenBridgeCreator).
 *
 * These are proxy contracts deployed on every parent chain. We fetch the implementation
 * ABI for each chain and assert they all match, then return the ABI from the reference chain.
 */
async function generateAbiForFactoryContract(
  name: string,
  address: Record<ParentChainId, `0x${string}`>,
) {
  const chainId = referenceChain.id;

  await assertContractAbisMatch({ name, address });

  const client = createPublicClient({
    chain: chains.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const implementation = await getImplementation({ client, address: address[chainId] });
  const resolvedAddress = implementation !== zeroAddress ? implementation : address[chainId];

  const abi = await fetchAbi(chainId, resolvedAddress);
  return [{ name, abi, address }];
}

/**
 * Precompile contracts (e.g., ArbOwner, ArbGasInfo).
 *
 * These have a fixed address that is the same on every Arbitrum chain and are not proxies.
 */
async function generateAbiForPrecompileContract(name: string, address: `0x${string}`) {
  const abi = await fetchAbi(referenceChain.id, address);
  return [{ name, abi, address }];
}

/**
 * Core contracts (e.g., Rollup, SequencerInbox).
 *
 * These are proxy contracts from example deployments via factories.
 * The SequencerInbox contract has a single implementation.
 * The Rollup contract uses a dual-proxy pattern with primary (RollupAdminLogic)
 * and secondary (RollupUserLogic) implementations whose ABIs get merged and deduplicated.
 */
async function generateAbiForCoreContract(name: string, address: `0x${string}`) {
  const chainId = referenceChain.id;

  const client = createPublicClient({
    chain: chains.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const primaryImplementation = await getImplementation({ client, address });
  const primaryAbi: Abi = await fetchAbi(chainId, primaryImplementation);

  const secondaryImplementation = await getImplementation({
    client,
    address,
    secondary: true,
  });

  if (secondaryImplementation === zeroAddress) {
    return [{ name, abi: primaryAbi }];
  }

  const secondaryAbi: Abi = await fetchAbi(chainId, secondaryImplementation);

  // merge and deduplicate
  const common = new Set(primaryAbi.map((entry) => JSON.stringify(entry)));
  const secondaryOnly = secondaryAbi.filter((entry) => !common.has(JSON.stringify(entry)));

  return [{ name, abi: [...primaryAbi, ...secondaryOnly] }];
}

export function generate({
  name,
  address,
}: {
  name: string;
  address: Record<ParentChainId, `0x${string}`> | `0x${string}`;
}): Plugin {
  return {
    name: 'generate',
    async contracts() {
      if (typeof address === 'object') {
        return generateAbiForFactoryContract(name, address);
      }

      if (name.startsWith('Arb')) {
        const publicClient = createPublicClient({ chain: referenceChain, transport: http() });
        const arbOSVersion = await getArbOSVersion(publicClient);
        console.log(` (using ArbOS ${arbOSVersion})`);
        return generateAbiForPrecompileContract(name, address);
      }

      return generateAbiForCoreContract(name, address);
    },
  };
}
