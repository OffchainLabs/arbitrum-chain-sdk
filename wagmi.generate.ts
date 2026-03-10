import { Plugin } from '@wagmi/cli';
import { Abi } from 'abitype';
import { hashMessage, createPublicClient, http, zeroAddress } from 'viem';
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

function loadApiKey(key: string): string {
  const apiKey = process.env[key];

  if (typeof apiKey === 'undefined' || apiKey.length === 0) {
    throw new Error(`Missing the ${key} environment variable!`);
  }

  return apiKey;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const apiKey = loadApiKey('ETHERSCAN_API_KEY');

const referenceChain = arbitrumSepolia;

export async function logReferenceChain() {
  const client = createPublicClient({ chain: referenceChain, transport: http() });
  const arbOSVersion = await getArbOSVersion(client);
  console.log(
    `- Using ${referenceChain.name} (${referenceChain.id}) running ArbOS ${arbOSVersion} as reference\n`,
  );
}

export type ContractConfig = {
  name: string;
  version?: string;
  address: Record<ParentChainId, `0x${string}`> | `0x${string}`;
  implementation?: Record<ParentChainId, `0x${string}`>;
};

export async function fetchAbi(chainId: ParentChainId, address: `0x${string}`) {
  const client = createPublicClient({
    chain: chains.find((chain) => chain.id === chainId),
    transport: http(),
  });

  const implementation = await getImplementation({ client, address });

  if (implementation !== zeroAddress) {
    // replace proxy address with implementation address, so proper abis are compared
    address = implementation;
  }

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

  if (responseJson.message === 'NOTOK') {
    throw new Error(`Failed to fetch ABI for ${chainId}: ${responseJson.result}`);
  }

  return responseJson;
}

function allEqual<T>(array: T[]) {
  return array.every((value) => value === array[0]);
}

export async function assertContractAbisMatch(contract: ContractConfig) {
  const contractVersion = contract.version ? ` v${contract.version}` : '';

  // skip check when single address is provided
  if (typeof contract.address === 'string') {
    console.log(`- ${contract.name}${contractVersion} ✔\n`);
    return;
  }

  console.log(`- ${contract.name}${contractVersion}`);

  const abiHashes = await Promise.all(
    Object.entries(contract.address)
      // don't fetch abis for testnode
      .filter(([chainIdString]) => {
        const chainId = Number(chainIdString);
        return (
          chainId !== nitroTestnodeL1.id &&
          chainId !== nitroTestnodeL2.id &&
          chainId !== nitroTestnodeL3.id
        );
      })
      // fetch abis for all chains and hash them
      .map(async ([chainId, address], index) => {
        // sleep to avoid rate limiting
        await sleep(index * 1_000);

        const abi = await fetchAbi(Number(chainId) as ParentChainId, address);
        const abiHash = hashMessage(JSON.stringify(abi));

        console.log(`- ${abiHash} (${chainId})`);

        return abiHash;
      }),
  );

  // make sure all abis hashes are the same
  if (!allEqual(abiHashes)) {
    throw new Error(`- ${contract.name}`);
  }

  console.log(`- ${contract.name}${contractVersion} ✔\n`);
}

/**
 * Custom wagmi plugin that generates a combined ABI for Rollup contracts.
 *
 * Rollup contracts use an extension of OZ's ERC1967Upgrade that supports two
 * logic contracts (RollupAdminLogic and RollupUserLogic). This plugin fetches
 * ABIs for both implementations and merges them into a single ABI, deduplicating
 * entries using JSON.stringify (relies on consistent key ordering from the same API source).
 */
export function generate({
  name,
  address: _address,
}: {
  name: string;
  address: Record<ParentChainId, `0x${string}`> | `0x${string}`;
}): Plugin {
  const chainId = referenceChain.id;
  return {
    name: 'Rollup ABI',
    async contracts() {
      const client = createPublicClient({
        chain: chains.find((chain) => chain.id === chainId),
        transport: http(),
      });

      if (typeof _address === 'object') {
        await assertContractAbisMatch({ name, address: _address });
      }

      const address = typeof _address === 'string' ? _address : _address[chainId];
      const addressReturn =
        typeof _address === 'string'
          ? //
            name.startsWith('Arb')
            ? _address
            : undefined
          : _address;

      await sleep(1_000);
      const abi = await fetchAbi(chainId, address);
      await sleep(1_000);

      const primaryImplementationAddress = await getImplementation({ client, address });
      await sleep(1_000);

      if (primaryImplementationAddress === zeroAddress) {
        return [{ name, abi, address: addressReturn }];
      }
      const primaryImplementationAbi: Abi = await fetchAbi(chainId, primaryImplementationAddress);

      const secondaryImplementationAddress = await getImplementation({
        client,
        address,
        secondary: true,
      });

      if (secondaryImplementationAddress === zeroAddress) {
        return [{ name, abi: primaryImplementationAbi, address: addressReturn }];
      }

      await sleep(1_000);
      const secondaryImplementationAbi: Abi = await fetchAbi(
        chainId,
        secondaryImplementationAddress,
      );

      // merge and deduplicate
      const common = new Set(primaryImplementationAbi.map((entry) => JSON.stringify(entry)));
      const secondaryImplementationAbiOnly = secondaryImplementationAbi.filter(
        (entry) => !common.has(JSON.stringify(entry)),
      );

      return [
        {
          name,
          abi: [...primaryImplementationAbi, ...secondaryImplementationAbiOnly],
          address: addressReturn,
        },
      ];
    },
  };
}
