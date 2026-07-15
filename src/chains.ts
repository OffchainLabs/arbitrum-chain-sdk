import { defineChain, Chain, ChainContract, isAddress, zeroAddress } from 'viem';
import {
  mainnet,
  arbitrum as arbitrumOne,
  arbitrumNova,
  base,
  sepolia,
  arbitrumSepolia,
  baseSepolia,
} from 'viem/chains';

const nitroTestnodeL1 = defineChain({
  id: 1_337,
  network: 'Nitro Testnode L1',
  name: 'nitro-testnode-l1',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
});

const nitroTestnodeL2 = defineChain({
  id: 412_346,
  network: 'Nitro Testnode L2',
  name: 'nitro-testnode-l2',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8547'],
    },
    public: {
      http: ['http://127.0.0.1:8547'],
    },
  },
  testnet: true,
});

// the L3 deployed as part of the nitro-testnode framework uses a custom fee token
const nitroTestnodeL3 = defineChain({
  id: 333333,
  network: 'Nitro Testnode L3',
  name: 'nitro-testnode-l3',
  nativeCurrency: { name: 'AppTestToken', symbol: 'APP', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:3347'],
    },
    public: {
      http: ['http://127.0.0.1:3347'],
    },
  },
  testnet: true,
});

const customParentChains: Record<number, Chain> = {};

export function getCustomParentChains(): Chain[] {
  return Object.values(customParentChains);
}

/**
 * Registers a custom parent chain.
 *
 * `contracts.rollupCreator` and `contracts.tokenBridgeCreator` are optional: a
 * command only needs the factory address for the operation it performs, so
 * requiredness is enforced per-command at the CLI schema layer rather than here.
 * Any address that is provided is still validated as a non-zero address.
 *
 * @param {Chain} chain Regular `Chain` object, optionally carrying
 * `contracts.rollupCreator` and/or `contracts.tokenBridgeCreator`.
 *
 * @example
 * registerCustomParentChain({
 *   id: 123_456,
 *   name: `My Chain`,
 *   network: `my-chain`,
 *   nativeCurrency: {
 *     name: 'Ether',
 *     symbol: 'ETH',
 *     decimals: 18,
 *   },
 *   rpcUrls: {
 *     public: {
 *       http: ['http://localhost:8080'],
 *     },
 *     default: {
 *       http: ['http://localhost:8080'],
 *     },
 *   },
 *   // provide the ones the operation needs
 *   contracts: {
 *     rollupCreator: {
 *       address: '0x0000000000000000000000000000000000000001',
 *     },
 *     tokenBridgeCreator: {
 *       address: '0x0000000000000000000000000000000000000002',
 *     },
 *   },
 * });
 */
export function registerCustomParentChain(
  chain: Chain & {
    contracts?: {
      rollupCreator?: ChainContract;
      tokenBridgeCreator?: ChainContract;
    };
  },
) {
  const rollupCreator = chain.contracts?.rollupCreator?.address;
  const tokenBridgeCreator = chain.contracts?.tokenBridgeCreator?.address;

  if (rollupCreator !== undefined && (!isAddress(rollupCreator) || rollupCreator === zeroAddress)) {
    throw new Error(
      `"contracts.rollupCreator.address" is invalid for custom parent chain with id ${chain.id}`,
    );
  }

  if (
    tokenBridgeCreator !== undefined &&
    (!isAddress(tokenBridgeCreator) || tokenBridgeCreator === zeroAddress)
  ) {
    throw new Error(
      `"contracts.tokenBridgeCreator.address" is invalid for custom parent chain with id ${chain.id}`,
    );
  }

  customParentChains[chain.id] = chain;
}

export const mainnets = [
  // mainnet L1
  mainnet,
  // mainnet L2
  arbitrumOne,
  arbitrumNova,
  base,
];

export const testnets = [
  // testnet L1
  sepolia,
  // testnet L2
  arbitrumSepolia,
  baseSepolia,
  // local nitro-testnode
  nitroTestnodeL1,
  nitroTestnodeL2,
  nitroTestnodeL3,
];

export const chains = [...mainnets, ...testnets] as const;

export {
  // mainnet L1
  mainnet,
  // mainnet L2
  arbitrumOne,
  arbitrumNova,
  base,
  // testnet L1
  sepolia,
  // testnet L2
  arbitrumSepolia,
  baseSepolia,
  // local nitro-testnode
  nitroTestnodeL1,
  nitroTestnodeL2,
  nitroTestnodeL3,
};
