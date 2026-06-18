import {
  Address,
  EIP1193RequestFn,
  Hex,
  createPublicClient,
  createTransport,
  encodeFunctionData,
  http,
} from 'viem';
import { arbitrum, arbitrumSepolia, sepolia } from 'viem/chains';
import { it, expect, vi, describe } from 'vitest';

import { gnosisSafeL2ABI } from './contracts/GnosisSafeL2';
import { rollupABI } from './contracts/Rollup';

import { getValidators } from './getValidators';
import { rollupAdminLogicPrepareFunctionData } from './rollupAdminLogicPrepareTransactionRequest';

const client = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

const arbitrumSepoliaClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http('https://sepolia.gateway.tenderly.co'),
});

function mockLog(transactionHash: string) {
  return {
    address: '0x193e2887031c148ab54f5e856ea51ae521661200',
    args: { id: 6n },
    blockHash: '0x3bafb9574d8a3a7c09070935dc3ca936a5df06e2abd09cbd2a3cd489562e748f',
    blockNumber: 35635757n,
    data: '0x',
    eventName: 'OwnerFunctionCalled',
    logIndex: 42,
    removed: false,
    topics: [
      '0xea8787f128d10b2cc0317b0c3960f9ad447f7f6c1ed189db1083ccffd20f456e',
      '0x0000000000000000000000000000000000000000000000000000000000000006',
    ],
    transactionHash,
    transactionIndex: 3,
  };
}
function mockTransaction(data: Hex) {
  return {
    accessList: [],
    blockHash: '0x3bafb9574d8a3a7c09070935dc3ca936a5df06e2abd09cbd2a3cd489562e748f',
    blockNumber: 35635757n,
    chainId: 421614,
    from: '0xfd5735380689a53e6b048e980f34cb94be9fd0c7',
    gas: 7149526n,
    gasPrice: 147390000n,
    hash: '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10',
    input: data,
    maxFeePerGas: 174300000n,
    maxPriorityFeePerGas: 0n,
    nonce: 82,
    r: '0x49cabfb3327a9f8c0fb8da0d8b3b81daf2f46d09ebc3c640b09d788f51159b7f',
    s: '0x2ee5ae568a892beed3a763c33c8da4a3368be0b2422f2785fe00be76ecad08f8',
    to: '0x06e341073b2749e0bb9912461351f716decda9b0',
    transactionIndex: 3,
    type: 'eip1559',
    typeHex: '0x2',
    v: 1n,
    value: 0n,
    yParity: 1,
  };
}
function mockData({
  logs,
  method,
  params,
}: {
  logs: {
    [transactionHash: string]: Hex;
  };
  method:
    | 'eth_getLogs'
    | 'eth_getTransactionByHash'
    | 'eth_getTransactionReceipt'
    | 'eth_blockNumber';
  params: string;
}) {
  if (method === 'eth_getLogs') {
    return Object.keys(logs).map((transactionHash) => mockLog(transactionHash));
  }

  if (method === 'eth_getTransactionByHash') {
    return mockTransaction(logs[params]);
  }

  if (method === 'eth_getTransactionReceipt') {
    return {
      blockNumber: 35635757,
    };
  }

  if (method === 'eth_blockNumber') {
    return 35635757;
  }

  return null;
}

const validInput =
  '0xcb73d6e2000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000725d217057e509dd284ee0e13ac846cfea0b7bb100000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000019999000000000000000000000000d1fe5b0a963a0e557aabb59cb61ffdd568b4605c00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000005f5e100000000000000000000000000000000000000000000000000000000000000009600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016345785d8a00000754e09320c381566cc0449904c377a52bd34a6b9404432e80afd573b67f7b17000000000000000000000000fd5735380689a53e6b048e980f34cb94be9fd0c700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000fe22e119e00000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001680000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000151800000000000000000000000000000000000000000000000000000000000000e1000000000000000000000000000000000000000000000000000000000000002757b22686f6d657374656164426c6f636b223a302c2264616f466f726b426c6f636b223a6e756c6c2c2264616f466f726b537570706f7274223a747275652c22656970313530426c6f636b223a302c2265697031353048617368223a22307830303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030222c22656970313535426c6f636b223a302c22656970313538426c6f636b223a302c2262797a616e7469756d426c6f636b223a302c22636f6e7374616e74696e6f706c65426c6f636b223a302c2270657465727362757267426c6f636b223a302c22697374616e62756c426c6f636b223a302c226d756972476c6163696572426c6f636b223a302c226265726c696e426c6f636b223a302c226c6f6e646f6e426c6f636b223a302c22636c69717565223a7b22706572696f64223a302c2265706f6368223a307d2c22617262697472756d223a7b22456e61626c654172624f53223a747275652c22416c6c6f774465627567507265636f6d70696c6573223a66616c73652c2244617461417661696c6162696c697479436f6d6d6974746565223a747275652c22496e697469616c4172624f5356657273696f6e223a31312c2247656e65736973426c6f636b4e756d223a302c224d6178436f646553697a65223a32343537362c224d6178496e6974436f646553697a65223a34393135322c22496e697469616c436861696e4f776e6572223a22307846643537333533383036383941353365364230343865393830463334634239346265396644306337227d2c22636861696e4964223a36383231393137393432327d000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000006a23ccc1c36d2aaa98aef2a4471cf807dd22e45b';
const upgradeExecutorAddress = '0x314f3c2f9803f8828a1050127be5bb29a4940f29';
const rollupAddress = '0xe0875cbd144fe66c015a95e5b2d2c15c3b612179';

function setValidatorHelper(args: [Address[], boolean[]]) {
  return encodeFunctionData({
    abi: rollupABI,
    functionName: 'setValidator',
    args,
  });
}
function upgradeExecutorSetValidatorHelper(args: [Address[], boolean[]]) {
  return rollupAdminLogicPrepareFunctionData({
    rollup: rollupAddress,
    functionName: 'setValidator',
    args,
    abi: rollupABI,
    upgradeExecutor: upgradeExecutorAddress,
  }).data;
}
function safeSetValidatorHelper(args: [Address[], boolean[]]) {
  const bytes = upgradeExecutorSetValidatorHelper(args);
  return encodeFunctionData({
    abi: gnosisSafeL2ABI,
    functionName: 'execTransaction',
    args: [
      rollupAddress,
      0n,
      bytes,
      0,
      0n,
      0n,
      0n,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x000000000000000000000000AD46AD093FD26B4464B756AC1B56985AF87399E7000000000000000000000000000000000000000000000000000000000000000001ABFD0989138206FEC57AE925D0B8CC27ECBB4484DC4CE1133D90E2BA4A644E6179F6640360B48976145461BBC820378F733421ADFCF78730FD20408BB10C284F1B',
    ],
  });
}

it('getValidators return all validators (Xai)', async () => {
  const { isAccurate, validators } = await getValidators(client, {
    rollup: '0xc47dacfbaa80bd9d8112f4e8069482c2a3221336',
  });
  expect(validators).toEqual(['0x25EA41f0bDa921a0eBf48291961B1F10b59BC6b8']);
  expect(isAccurate).toBeFalsy();
});

// https://sepolia.arbiscan.io/tx/0x5b0b49e0259289fc89949a55a5ad35a8939440a55065d29b14e5e7ef7494efff
it('getValidators returns validators for a chain created with RollupCreator v1.1', async () => {
  const { isAccurate, validators } = await getValidators(arbitrumSepoliaClient, {
    rollup: '0x1644590Fd2223264ea8Cda8927B038CcCFE0Da76',
  });
  expect(validators).toEqual(['0x8E842599F71ABD661737bb3108a53E5b1787c791']);
  expect(isAccurate).toBeTruthy();
});

// https://sepolia.arbiscan.io/tx/0x77db43157182a69ce0e6d2a0564d2dabb43b306d48ea7b4d877160d6a1c9b66d
it('getValidators returns validators for a chain created with RollupCreator v2.1', async () => {
  const { isAccurate, validators } = await getValidators(arbitrumSepoliaClient, {
    rollup: '0x66d0e72952f4f69aF9D33C1B7C31Fa9aCDbCAF63',
  });
  expect(validators).toEqual([
    '0xDBb2c9923b5DE18B151bC55Ed571EDcd1fC7EeB9',
    '0x84B2EFFDd54aA5dce861440Ae9B9D320b043a64c',
    '0x39B4Ce32E557225a401917a701ac4d267648635a',
    '0xe2D0cC872647B1A129B942BbFC980B31E8e94Df2',
  ]);
  expect(isAccurate).toBeTruthy();
});

// https://sepolia.etherscan.io/tx/0xd79a80b7300df1bcb14e2e3ea83521d1ae37e5f171a787fb0f5377ea7f5003ad
it('getValidators returns validators for a chain created with RollupCreator v3.1', async () => {
  const { isAccurate, validators } = await getValidators(sepoliaClient, {
    rollup: '0x5D65e18b873dD978EeE4704BC6033436aA253936',
  });
  expect(validators).toEqual(['0x776C1B18cde829C020ce1a3f75ae3B82F6a9108a']);
  expect(isAccurate).toBeTruthy();
});

// https://sepolia.arbiscan.io/tx/0x67bb216d4dd1b1807d9f0e226e4da754bdf643e2788f9e515b37c6dd890be331
it('getValidators returns validators for a chain created with RollupCreator v3.2', async () => {
  const { isAccurate, validators } = await getValidators(arbitrumSepoliaClient, {
    rollup: '0x80630e3776E445c256E82D5ACcA2Bbb4b0c95a98',
  });
  expect(validators).toEqual([
    '0xd0E7B8f304461d57E8b49b660DbD46e34E877A81',
    '0x7C6F07e8c7Cb8d4e4574f1E346B53f330B60c00f',
    '0x300E8715236B5e0aEefb0Af16315a1e729E6A002',
  ]);
  expect(isAccurate).toBeTruthy();
});

describe('createRollupFunctionSelector', () => {
  it('getValidators return all validators with isAccurate flag set to true', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10': validInput,
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual(['0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b']);
    expect(isAccurate).toBeTruthy();
  });

  it('getValidators return all validators with isAccurate flag set to false', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10': validInput,
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c': '0xdeadbeef',
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual(['0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b']);
    expect(isAccurate).toBeFalsy();
  });
});

describe('setValidatorFunctionSelector', () => {
  it('getValidators return all validators with isAccurate flag set to true', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                setValidatorHelper([['0x25EA41f0bDa921a0eBf48291961B1F10b59BC6b8'], [true]]),
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c':
                setValidatorHelper([
                  [
                    '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
                    '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
                  ],
                  [true, false],
                ]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([
      '0x25EA41f0bDa921a0eBf48291961B1F10b59BC6b8',
      '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
    ]);
    expect(isAccurate).toBeTruthy();
  });

  it('getValidators return all validators with isAccurate flag set to false', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                setValidatorHelper([['0x25EA41f0bDa921a0eBf48291961B1F10b59BC6b8'], [true]]),
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c': '0xdeadbeef',
              '0x10f4f4d214af281a67713ddaf799f0524f833c57818863e8c1b117394e872f3a':
                setValidatorHelper([
                  [
                    '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
                    '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
                  ],
                  [false, true],
                ]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([
      '0x25EA41f0bDa921a0eBf48291961B1F10b59BC6b8',
      '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
    ]);
    expect(isAccurate).toBeFalsy();
  });
});

describe('upgradeExecutorExecuteCallFunctionSelector', () => {
  it('getValidators return all validators with isAccurate flag set to true', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                upgradeExecutorSetValidatorHelper([
                  ['0x81209B63188f27339441B741518fF73F18b4Efd4'],
                  [true],
                ]),
              '0x10f4f4d214af281a67713ddaf799f0524f833c57818863e8c1b117394e872f3a':
                upgradeExecutorSetValidatorHelper([
                  [
                    '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
                    '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
                  ],
                  [true, true],
                ]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([
      '0x81209B63188f27339441B741518fF73F18b4Efd4',
      '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
      '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
    ]);
    expect(isAccurate).toBeTruthy();
  });

  it('getValidators return all validators with isAccurate flag set to false', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c': '0xdeadbeef',
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                upgradeExecutorSetValidatorHelper([
                  ['0x81209B63188f27339441B741518fF73F18b4Efd4'],
                  [true],
                ]),
              '0x10f4f4d214af281a67713ddaf799f0524f833c57818863e8c1b117394e872f3a':
                upgradeExecutorSetValidatorHelper([
                  [
                    '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
                    '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
                  ],
                  [false, false],
                ]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual(['0x81209B63188f27339441B741518fF73F18b4Efd4']);
    expect(isAccurate).toBeFalsy();
  });
});

describe('safeL2FunctionSelector', () => {
  it('getValidators return all validators with isAccurate flag set to true', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                safeSetValidatorHelper([['0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962'], [true]]),
              '0x10f4f4d214af281a67713ddaf799f0524f833c57818863e8c1b117394e872f3a':
                safeSetValidatorHelper([
                  [
                    '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
                    '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
                  ],
                  [false, true],
                ]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([
      '0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962',
      '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
    ]);
    expect(isAccurate).toBeTruthy();
  });

  it('getValidators return all validators with isAccurate flag set to false', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c': '0xdeadbeef',
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                safeSetValidatorHelper([['0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962'], [true]]),
              '0x10f4f4d214af281a67713ddaf799f0524f833c57818863e8c1b117394e872f3a':
                safeSetValidatorHelper([
                  [
                    '0x6a23CcC1c36D2aaA98AeF2a4471cf807DD22e45b',
                    '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
                  ],
                  [false, true],
                ]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([
      '0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962',
      '0x9481eF9e2CA814fc94676dEa3E8c3097B06b3a33',
    ]);
    expect(isAccurate).toBeFalsy();
  });
});

describe('Detect validators added or removed multiple times', () => {
  it('when disabling the same validator multiple time', async () => {
    const validator = '0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962';
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                safeSetValidatorHelper([[validator], [false]]),
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c':
                safeSetValidatorHelper([[validator], [false]]),
              '0x10f4f4d214af281a67713ddaf799f0524f833c57818863e8c1b117394e872f3a':
                safeSetValidatorHelper([[validator], [true]]),
              '0x1acada0382b0ae715c41365c71b780871ec5adcfced8e57f0ae009c4b8738e2a':
                safeSetValidatorHelper([[validator], [false]]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([]);
    expect(isAccurate).toBeTruthy();
  });
  it('when enabling the same validators multiple time', async () => {
    const validator = '0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962';
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                safeSetValidatorHelper([[validator], [true]]),
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c':
                safeSetValidatorHelper([[validator], [true]]),
              '0x1acada0382b0ae715c41365c71b780871ec5adcfced8e57f0ae009c4b8738e2a':
                safeSetValidatorHelper([[validator], [false]]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([]);
    expect(isAccurate).toBeTruthy();
  });
  it('when adding an existing validator', async () => {
    const validator = '0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962';
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                safeSetValidatorHelper([[validator], [true]]),
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c':
                safeSetValidatorHelper([[validator], [true]]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([validator]);
    expect(isAccurate).toBeTruthy();
  });
  it('when removing an existing validator', async () => {
    const validator = '0xC0b97e2998edB3Bf5c6369e7f7eFfb49c36fA962';
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: {
              '0x448fdaac1651fba39640e2103d83f78ff4695f95727f318f0f9e62c3e2d77a10':
                safeSetValidatorHelper([[validator], [false]]),
              '0x6e29af776e4b08f92b484a3d4ecc506a4b6455bbd335a2547c4e97d6151f588c':
                safeSetValidatorHelper([[validator], [false]]),
              '0x1acada0382b0ae715c41365c71b780871ec5adcfced8e57f0ae009c4b8738e2a':
                safeSetValidatorHelper([[validator], [true]]),
            },
            method,
            params,
          });
        }) as unknown as EIP1193RequestFn,
        type: 'mock',
      });

    const mockClient = createPublicClient({
      transport: mockTransport,
      chain: arbitrumSepolia,
    });

    const { validators, isAccurate } = await getValidators(mockClient, {
      rollup: rollupAddress,
    });

    expect(validators).toEqual([validator]);
    expect(isAccurate).toBeTruthy();
  });
});
