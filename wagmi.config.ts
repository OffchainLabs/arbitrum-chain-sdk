import { Config } from '@wagmi/cli';
import { erc } from '@wagmi/cli/plugins';

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
} from './src/chains';
import { generate, ContractConfig } from './wagmi.generate';

// @ts-expect-error -- viem chain rpcUrls are typed as readonly
mainnet.rpcUrls.default.http[0] = 'https://mainnet.gateway.tenderly.co';
// @ts-expect-error -- viem chain rpcUrls are typed as readonly
mainnet.rpcUrls.public.http[0] = 'https://mainnet.gateway.tenderly.co';
// @ts-expect-error -- viem chain rpcUrls are typed as readonly
sepolia.rpcUrls.default.http[0] = 'https://sepolia.gateway.tenderly.co';
// @ts-expect-error -- viem chain rpcUrls are typed as readonly
sepolia.rpcUrls.public.http[0] = 'https://sepolia.gateway.tenderly.co';

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
      [mainnet.id]: '0xe06Bc77336E201c4C08751918A4bB99ddf0e1Bf7',
      // mainnet L2
      [arbitrumOne.id]: '0xF5962AD061A1aD6F38F340F5b267b3593cC1Cd7B',
      [arbitrumNova.id]: '0xF5962AD061A1aD6F38F340F5b267b3593cC1Cd7B',
      [base.id]: '0x8d1668636D053C10F57367D68118bD624f41ffe6',
      // testnet L1
      [sepolia.id]: '0xe06Bc77336E201c4C08751918A4bB99ddf0e1Bf7',
      // testnet L2
      [arbitrumSepolia.id]: '0xF5962AD061A1aD6F38F340F5b267b3593cC1Cd7B',
      [baseSepolia.id]: '0x8d1668636D053C10F57367D68118bD624f41ffe6',
      // local nitro-testnode (on "release" branch with --tokenbridge --l3node --l3-token-bridge flags)
      [nitroTestnodeL1.id]: '0xe6D50099f4d891240435143193d46581A1447202',
      [nitroTestnodeL2.id]: '0xbcF51F3AAb5D5Efa025b4A2B235BDc9F3f69b4d2',
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
    name: 'Rollup',
    version: '1.1',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0xb2df7e9658eceb2c94567ad537a34892e093ce06f3d4234a9899b4315167cb71
    address: '0xDCb63cfb74EE8F66c6188EdCB886B10FF0B7a75a',
  },
  {
    name: 'Rollup',
    version: '2.1',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0x72d481d03556fb831b505cf7d9695bd7da96fce2c4a282868be0384d580e6902
    address: '0xF847994AC56799D7dE2F5e51B9E5d1d001cAc3c3',
  },
  {
    name: 'Rollup',
    version: '3.1',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0x20c5ef96d3d30c252ce9e6b76b25ffcbb44dfc2564d9e17179ecceef09272ee2
    address: '0x07F6Fa22Bf5F3AFbcE2594396F2B943c5720F40d',
  },
  {
    name: 'Rollup',
    version: '3.2',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0xbf2e35ed7d1a6f933e79f875deef2bf625ea628067b3b23c34afce9d6f8a8ce1
    address: '0x285EC466b4b7ac52246436ab1224618fA500b489',
  },
  {
    name: 'SequencerInbox',
    version: '1.1',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0xb2df7e9658eceb2c94567ad537a34892e093ce06f3d4234a9899b4315167cb71
    address: '0x9276C725191D71D30855D7E20a291962B4392704',
  },
  {
    name: 'SequencerInbox',
    version: '2.1',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0x72d481d03556fb831b505cf7d9695bd7da96fce2c4a282868be0384d580e6902
    address: '0x3D915f1cDB4DdA7049db0ec85a82cf243D118100',
  },
  {
    name: 'SequencerInbox',
    version: '3.1',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0x20c5ef96d3d30c252ce9e6b76b25ffcbb44dfc2564d9e17179ecceef09272ee2
    address: '0x6862a3667cb1aDfF76fEa9FbD9bBB02488Ce0981',
  },
  {
    name: 'SequencerInbox',
    version: '3.2',
    // example deployment via factory
    // https://sepolia.arbiscan.io/tx/0xbf2e35ed7d1a6f933e79f875deef2bf625ea628067b3b23c34afce9d6f8a8ce1
    address: '0x68FF3d308F3a9Bc321c499eeE85c897D4B351f64',
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

export default async function () {
  const configs: Config[] = [
    {
      out: 'src/contracts/ERC20.ts',
      plugins: [erc({ 20: true, 721: false, 4626: false })],
    },
  ];

  for (const contract of contracts) {
    const filePath =
      typeof contract.version !== 'undefined'
        ? `${contract.name}/v${contract.version}`
        : contract.name;

    configs.push({
      out: `src/contracts/${filePath}.ts`,
      plugins: [
        generate({
          name: contract.name,
          address: contract.address,
        }),
      ],
    });
  }

  return configs;
}
