import { Config } from '@wagmi/cli';
import { erc, etherscan } from '@wagmi/cli/plugins';
import { hashMessage, createPublicClient, http, zeroAddress } from 'viem';
import dotenv from 'dotenv';

import { ParentChainId } from './src';
import {
  mainnet,
  arbitrumOne,
  arbitrumNova,
  base,
  sepolia,
  arbitrumSepolia,
  baseSepolia,
  nitroTestnodeL1,
  nitroTestnodeL2,
  nitroTestnodeL3,
  chains,
} from './src/chains';
import { getImplementation } from './src/utils/getImplementation';

dotenv.config();

function loadApiKey(key: string): string {
  const apiKey = process.env[key];

  if (typeof apiKey === 'undefined' || apiKey.length === 0) {
    throw new Error(`Missing the ${key} environment variable!`);
  }

  return apiKey;
}

function sleep(ms: number = 1_000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// @ts-ignore
mainnet.rpcUrls.default.http[0] = 'https://mainnet.gateway.tenderly.co';
// @ts-ignore
mainnet.rpcUrls.public.http[0] = 'https://mainnet.gateway.tenderly.co';
// @ts-ignore
sepolia.rpcUrls.default.http[0] = 'https://sepolia.gateway.tenderly.co';
// @ts-ignore
sepolia.rpcUrls.public.http[0] = 'https://sepolia.gateway.tenderly.co';

const apiKey = loadApiKey('ETHERSCAN_API_KEY');

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

type ContractConfig = {
  name: string;
  version?: string;
  address: Record<ParentChainId, `0x${string}`> | `0x${string}`;
  implementation?: Record<ParentChainId, `0x${string}`>;
};

const contracts: ContractConfig[] = [
  {
    name: 'RollupCreator',
    version: '1.1',
    address: {
      // mainnet L1
      [mainnet.id]: '0x90d68b056c411015eae3ec0b98ad94e2c91419f1',
      // mainnet L2
      [arbitrumOne.id]: '0x9CAd81628aB7D8e239F1A5B497313341578c5F71',
      [arbitrumNova.id]: '0x9CAd81628aB7D8e239F1A5B497313341578c5F71',
      [base.id]: '0x850F050C65B34966895AdA26a4D06923901916DB',
      // testnet L1
      [sepolia.id]: '0xfbd0b034e6305788007f6e0123cc5eae701a5751',
      // testnet L2
      [arbitrumSepolia.id]: '0x06E341073b2749e0Bb9912461351f716DeCDa9b0',
      [baseSepolia.id]: '0x1E0921818df948c338380e722C8aE91Bb285763C',
      // local nitro-testnode (on "release" branch with --tokenbridge --l3node --l3-token-bridge flags)
      [nitroTestnodeL1.id]: '0x596eabe0291d4cdafac7ef53d16c92bf6922b5e0',
      [nitroTestnodeL2.id]: '0x3BaF9f08bAD68869eEdEa90F2Cc546Bd80F1A651',
    },
  },
  {
    name: 'RollupCreator',
    version: '2.1',
    address: {
      // mainnet L1
      [mainnet.id]: '0x8c88430658a03497D13cDff7684D37b15aA2F3e1',
      // mainnet L2
      [arbitrumOne.id]: '0x79607f00e61E6d7C0E6330bd7E9c4AC320D50FC9',
      [arbitrumNova.id]: '0x9B523BF5F77e8d90e0E9eb0924aEA6E40B081aE6',
      [base.id]: '0x091b8FC0F48613b191f81009797ce55Cf97Af7C8',
      // testnet L1
      [sepolia.id]: '0xfb774ea8a92ae528a596c8d90cbcf1bdbc4cee79',
      // testnet L2
      [arbitrumSepolia.id]: '0xd2Ec8376B1dF436fAb18120E416d3F2BeC61275b',
      [baseSepolia.id]: '0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502',
      // local nitro-testnode (on "release" branch with --tokenbridge --l3node --l3-token-bridge flags)
      [nitroTestnodeL1.id]: '0x82a3c114b40ecf1fc34745400a1b9b9115c33d31',
      [nitroTestnodeL2.id]: '0x4287839696d650a0cf93b98351e85199102335d0',
    },
  },
  {
    name: 'RollupCreator',
    version: '3.1',
    address: {
      // mainnet L1
      [mainnet.id]: '0x43698080f40dB54DEE6871540037b8AB8fD0AB44',
      // mainnet L2
      [arbitrumOne.id]: '0xB90e53fd945Cd28Ec4728cBfB566981dD571eB8b',
      [arbitrumNova.id]: '0xF916Bfe431B7A7AaE083273F5b862e00a15d60F4',
      [base.id]: '0xDbe3e840569a0446CDfEbc65D7d429c5Da5537b7',
      // testnet L1
      [sepolia.id]: '0x687Bc1D23390875a868Db158DA1cDC8998E31640',
      // testnet L2
      [arbitrumSepolia.id]: '0x5F45675AC8DDF7d45713b2c7D191B287475C16cF',
      [baseSepolia.id]: '0x70cA29dA3B116A2c4A267c549bf7947d47f41e22',
      // local nitro-testnode (on "release" branch with --tokenbridge --l3node --l3-token-bridge flags)
      [nitroTestnodeL1.id]: '0xb562622f2D76F355D673560CB88c1dF6088702f1',
      [nitroTestnodeL2.id]: '0x1E08B9c3f94E9aBcc531f67F949d796eC76963b9',
    },
  },
  {
    name: 'RollupCreator',
    version: '3.2',
    address: {
      // mainnet L1
      [mainnet.id]: '0x0000000000000000000000000000000000000000',
      // mainnet L2
      [arbitrumOne.id]: '0x0000000000000000000000000000000000000000',
      [arbitrumNova.id]: '0x0000000000000000000000000000000000000000',
      [base.id]: '0x0000000000000000000000000000000000000000',
      // testnet L1
      [sepolia.id]: '0x0000000000000000000000000000000000000000',
      // testnet L2
      [arbitrumSepolia.id]: '0x04aFd6BaAd7805c3e6F8f86B9D3EE087F9FCa131',
      [baseSepolia.id]: '0x0000000000000000000000000000000000000000',
      // local nitro-testnode (on "release" branch with --tokenbridge --l3node --l3-token-bridge flags)
      [nitroTestnodeL1.id]: '0x0000000000000000000000000000000000000000',
      [nitroTestnodeL2.id]: '0x0000000000000000000000000000000000000000',
    },
  },
  {
    name: 'TokenBridgeCreator',
    version: '1.2',
    address: {
      // mainnet L1
      [mainnet.id]: '0x60D9A46F24D5a35b95A78Dd3E793e55D94EE0660',
      // mainnet L2
      [arbitrumOne.id]: '0x2f5624dc8800dfA0A82AC03509Ef8bb8E7Ac000e',
      [arbitrumNova.id]: '0x8B9D9490a68B1F16ac8A21DdAE5Fd7aB9d708c14',
      [base.id]: '0x4C240987d6fE4fa8C7a0004986e3db563150CA55',
      // testnet L1
      [sepolia.id]: '0x7edb2dfBeEf9417e0454A80c51EE0C034e45a570',
      // testnet L2
      [arbitrumSepolia.id]: '0x56C486D3786fA26cc61473C499A36Eb9CC1FbD8E',
      [baseSepolia.id]: '0xFC71d21a4FE10Cc0d34745ba9c713836f82f8DE3',
      // local nitro-testnode (on "release" branch with --tokenbridge --l3node --l3-token-bridge flags)
      [nitroTestnodeL1.id]: '0x4Af567288e68caD4aA93A272fe6139Ca53859C70',
      [nitroTestnodeL2.id]: '0x38F35Af53bF913c439eaB06A367e09D6eb253492',
    },
  },
  {
    name: 'ArbOwner',
    address: '0x0000000000000000000000000000000000000070',
  },
  {
    name: 'ArbGasInfo',
    address: '0x000000000000000000000000000000000000006c',
  },
  {
    name: 'ArbOwnerPublic',
    address: '0x000000000000000000000000000000000000006b',
  },
  {
    name: 'ArbAggregator',
    address: '0x000000000000000000000000000000000000006d',
  },
];

function allEqual<T>(array: T[]) {
  return array.every((value) => value === array[0]);
}

export async function assertContractAbisMatch(contract: ContractConfig) {
  // skip check when single address is provided
  if (typeof contract.address === 'string') {
    console.log(`- ${contract.name} ✔\n`);
    return;
  }

  console.log(`- ${contract.name}${contract.version ? ` v${contract.version}` : ''}`);

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
        await sleep(index * 500);

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

  console.log(`- ${contract.name}${contract.version ? ` v${contract.version}` : ''} ✔\n`);
}

async function updateContractWithImplementationIfProxy(contract: ContractConfig) {
  // precompiles, do nothing
  if (typeof contract.address === 'string') {
    return;
  }

  const implementation = await getImplementation({
    client: createPublicClient({ chain: arbitrumSepolia, transport: http() }),
    address: contract.address[arbitrumSepolia.id],
  });

  // not a proxy, do nothing
  if (implementation === zeroAddress) {
    return;
  }

  // only add arbitrum sepolia implementation as that's the one we're generating from
  contract.implementation = { [arbitrumSepolia.id]: implementation };
}

export default async function () {
  const configs: Config[] = [
    {
      out: 'src/contracts/ERC20.ts',
      plugins: [erc({ 20: true, 721: false, 4626: false })],
    },
  ];

  for (const contract of contracts) {
    // await assertContractAbisMatch(contract);
    await updateContractWithImplementationIfProxy(contract);
    await sleep(); // sleep to avoid rate limiting

    const filePath =
      typeof contract.version !== 'undefined'
        ? `${contract.name}/v${contract.version}`
        : contract.name;

    configs.push({
      out: `src/contracts/${filePath}.ts`,
      plugins: [
        etherscan({
          chainId: arbitrumSepolia.id,
          apiKey,
          // todo: fix viem type issue
          contracts: [contract],
          cacheDuration: 0,
        }),
      ],
    });
  }

  return configs;
}
