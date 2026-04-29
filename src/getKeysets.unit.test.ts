import { EIP1193RequestFn, Hex, createPublicClient, createTransport, http, padHex } from 'viem';
import { arbitrum, arbitrumSepolia } from 'viem/chains';
import { it, expect, vi, describe } from 'vitest';
import { getKeysets } from './getKeysets';

const client = createPublicClient({
  chain: arbitrum,
  transport: http(),
});

const mockEventCommon = {
  address: '0xa58f38102579dae7c584850780dda55744f67df1',
  blockNumber: 183097536n,
  transactionHash: '0x13baa9be2bf267fde01e730855d34526f339a21f1877af175f0958e5dc546e6d',
  transactionIndex: 1,
  blockHash: '0x31d403a11112e6a8be0e24423df83341790a8c1cc1728a2c2deff1b683961635',
  logIndex: 0,
  data: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000013300000000000000010000000000000001012160184f37a4eaea75e8252d38d5b3f0298703794d58f38b3551104ce0c2472aea78f53ccd07fdb7b1c5b08444d2be9025d519ccc21d12fd9f8b67c50615694b626aaec898b9c1e613b0c17aac28539ee667a98e08d734193de9b2e612b4b082439506aa6ff965bfff2e8d3e6ade9e038412d767778850c717b388fb17e40c359c8ef3b99b4e7aee94b88f7d96c09e8d522a0f24d90efa7db34f42cefa18ae1ab1e08f780e613e0baf8e28c322a0d52b915fcff3e143a9daa7c2ba525029066f8230120e9803fd21d332015b3ec22ae180cbd1f3cf89561a0c5bd914dc5f746d692cefcb4762a012af0fe55c1148f138221a196fbec9942400b7772ce371c8ccc8ed0cd3926398cd62f1b900758b82591174295eb7ac00555d40051ad280ceb2cfa700000000000000000000000000',
} as const;
function mockSetValidKeysetEvent(keysetHash?: Hex, keysetBytes?: Hex) {
  return {
    ...mockEventCommon,
    args: {
      keysetHash,
      keysetBytes,
    },
    eventName: 'SetValidKeyset',
  };
}
function mockInvalidateKeysetHashEvent(keysetHash: Hex) {
  return {
    ...mockEventCommon,
    args: {
      keysetHash,
    },
    eventName: 'InvalidateKeyset',
  };
}
function mockData({
  logs,
  method,
}: {
  logs: unknown[];
  method:
    | 'eth_call'
    | 'eth_getLogs'
    | 'eth_getTransactionByHash'
    | 'eth_getTransactionReceipt'
    | 'eth_blockNumber';
  params: string;
}) {
  if (method === 'eth_getLogs') {
    return logs;
  }

  if (method === 'eth_call') {
    return padHex('0xe0875cbd144fe66c015a95e5b2d2c15c3b612179');
  }

  if (method === 'eth_getTransactionReceipt') {
    return {
      blockNumber: 183097536n,
    };
  }

  if (method === 'eth_blockNumber') {
    return 183097536n;
  }

  return null;
}

const sequencerInboxAddress = '0x041f85dd87c46b941dc9b15c6628b19ee5358485';

it('getValidKeysets return all keysets (Proof of play)', async () => {
  const { keysets } = await getKeysets(client, {
    sequencerInbox: '0xa58F38102579dAE7C584850780dDA55744f67DF1',
  });
  expect(keysets).toEqual({
    '0xc2c008db9d0d25ca30d60080f5ebd3d114dbccd95f2bd2df05446eae6b1acadf':
      '0x00000000000000010000000000000001012160184f37a4eaea75e8252d38d5b3f0298703794d58f38b3551104ce0c2472aea78f53ccd07fdb7b1c5b08444d2be9025d519ccc21d12fd9f8b67c50615694b626aaec898b9c1e613b0c17aac28539ee667a98e08d734193de9b2e612b4b082439506aa6ff965bfff2e8d3e6ade9e038412d767778850c717b388fb17e40c359c8ef3b99b4e7aee94b88f7d96c09e8d522a0f24d90efa7db34f42cefa18ae1ab1e08f780e613e0baf8e28c322a0d52b915fcff3e143a9daa7c2ba525029066f8230120e9803fd21d332015b3ec22ae180cbd1f3cf89561a0c5bd914dc5f746d692cefcb4762a012af0fe55c1148f138221a196fbec9942400b7772ce371c8ccc8ed0cd3926398cd62f1b900758b82591174295eb7ac00555d40051ad280ceb2cfa7',
  });
});

// https://docs.arbitrum.io/launch-orbit-chain/concepts/anytrust-orbit-chain-keyset-generation#keyset-generation
const keysetForZeroPK =
  '0x00000000000000010000000000000001012160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const keysetHashForZeroPK = '0x4d795e20d33eea0b070600e4e100c512a750562bf03c300c99444bd5af92d9b0';
const keyset =
  '0x0000000000000002000000000000000801216006dcb5e56764bb72e6a45e6deb301ca85d8c4315c1da2efa29927f2ac8fb25571ce31d2d603735fe03196f6d56bcbf9a1999a89a74d5369822c4445d676c15ed52e5008daa775dc9a839c99ff963a19946ac740579874dac4f639907ae1bc69f0c6694955b524d718ca445831c5375393773401f33725a79661379dddabd5fff28619dc070befd9ed73d699e5c236c1a163be58ba81002b6130709bc064af5d7ba947130b72056bf17263800f1a3ab2269c6a510ef8e7412fd56d1ef1b916a1306e3b1d9c82c099371bd9861582acaada3a16e9dfee5d0ebce61096598a82f112d0a935e8cab5c48d82e3104b0c7ba79157dad1a019a3e7f6ad077b8e6308b116fec0f58239622463c3631fa01e2b4272409215b8009422c16715dbede5909060121600835f995f2478f24892d050daa289f8b6b9c1b185bcd28532f88d610c2642a2dc6f3509740236d33c3e2d9136aab17f819c8c671293bba277717762e8d1c1f7bac9e17dd28d2939a959bb38e500f9c11c38cebbc426e2dea97c40175a655d17400ae6c75ff49e884c79469249e70953258854b64fa8445c585ad45dc6dc6975501c6af7cff7074202c687f8a7bf1a3ac192689755f232275b4c8421b1a5669e9b904c29a292cdf961b783a7c0b4ce736900de4d8c63c5f85a65cb44af34bef840acef84ab75f44c4c9137610b68107aff3bbdcc19119c7a927c115b7b9bfb27d85c500ee77d13ec5a97a3ae6bf51d3b70a5502e8416de7b5eb8e9feee376411ca35c8a7f3f597c7606578cf96a4715ce5a35cf48e39c0a1faa2dee22d74e681901216005db98e51080bb392a7b5ebdbfcf33e0f4f0193102cc40f79a9ef0a9557c5a62dd1ef800056946e8329f979ba0cc82510d0dc78c3cceffa66ee5de5e298987a9858bf5262171614e556f40687ce6912cbea6a5b44472cb3ff107ece69cbd0fda0db392a64a82be714077351d6384d6cea254ad3c21e45a87852dac39190865c449a647a4e39928dad7611b0d2074437d17e44c766f3e0a150852cde235d455271b91eca03d7ec91c910ca38540f6f7ab94fcbfa4c43a4dd0f064b6210037d9370b3ad702eb883dcbf7ae6d8fe6529164594692f00f9888c2e77d135e922585ad9ce1c16291b9ab3e4a98582b3edd209a100a005fe44fa2e4843bf1995991a8bfb5af0fd2c5e5749a4a96d8865f31cefb9368f6feacb61f2477f24ad332b6553201216006ce839de4d6a3ae02f25b4089531e6a3d2de556bd006bd30cf2d3408b977d18f1756dd4a1bc3c00db9002f0d8ef1af50fbaa6959decbec1cbe234cc6ef6270a03339090e0238f8ac9f8a18f44b8734c8f3b6123dd128ae48a0863b9a7f6d88302043681772c2b79f350c14bc9d7b18e578c795ca76925ce7bd2891d09aa37fe2ce1ea2ffe4c038fef22f66e28995c61090221e86a3368fb6d671aafc19001f4227f92f3671af6a60b3db1285a142f49c1f450b76feb9b1aef1a551e858e4b7302c6cf1ca7fac05b993ba375d8183f90c089fa8a3df31a443d2e0a8ef193067068fbfcca2cef234cf6d9c9b5884ef69705a71810a56651726ca3b7acdfaffdfab9b2844b4ea6872b43ff9b7da2e10a2e23a79130c3c4c70a8ad0a77eb2d51f160121600f872b898a4fd1b8ae73515f7d33cd7be1e971ce1896aabef2f8926e586c4248dc0db7fd7851402c14149dc3dc84f3830c346167c39e5323971ac340415f0a2eb054a9a8e0a5d503a2acfecebdd1df71aeeac3b38260480c699bc09934f0913e0ee5aaeabd57313285207eb89366b411286cf3f1c5e30eb7e355f55385308b91d5807284323ee89a9743c70676f4949504ced3ed41612cbfda06ad55200c1c77d3fb3700059befd64c44bc4a57cb567ec1481ee564cf6cd6cf1f2f4a2dee6db00c547c38400ab118dedae8afd5bab93b703f76a0991baa5d43fbb125194c06b5461f8c738a3c4278a3d98e5456aec0720883c0d28919537a36e2ffd5f731e742b6653557d154c164e068ef983b367ef626faaed46f4eadecbb12b7e55f23175d01216002c2ec378eb6ba17a9e81b8fd44263d699c34719492a4ecf1ee76a942bc22478fb7a9f94e2f15822630f2d616c32a3340387118e4b96e26d6e41dbaab9fe27ad608bd823a142f988f7da999cdeca08ab4afedb6b3da2d4db208cc0ba91bfd44e153bd73736b7df01341780aaa7f185fca0d3a478dfb53b612ed91f054416de7bd62c59d39b4ee604ea96cb42f3d6aa20112197b4b9acf736e47fb44cf00cbe3725227d8aea5bca1efbbb894c1cbb566a7ab1b701e81dafd5b9f3077ce4f8b2f8000a047fb88dc5dcf8afee7658df0f985333a31516fba62200760fe4256c0260b199949737fb88f77d75c35dea4349261213ee6bebbff350204aff7cd8461651bed57cb455184b90abf56a1bb23deffea9bb25daec5cd2be9d7ce010719b9d5a012160137e0965267913f9eaf85bff22e3ce5f44bb1bfaed7679b1680acd15436a84325eba7f2962ca46937ccbf46d99edc944034cdd97bc4fb1d8dc3addb9c348431a99975959e6ac8238376af31f03e754fa3c315927cd6860265ec8e6e97da40a9509327773e7aa5bcfaef7690d769063336f6d5210a7de55e0ebf251ffd53f6dca022267fbc3ffc08e4709e3414a96b804056dd7e7ffc38927d8a3d8a5c0f46a8e737d638e89ef5c96fc5dfe79a21da0a2b5cbd0c1bb2e95ca9bbff1d416585c2c0119b676dc053c5abb3b0b4d60eafa065715a2c301a8d58bac871df836dfc0eb8d4ede191cab4cf6655451a37c9cf376082a65d5f23b818c185c56b16ce980b6fe0d68838fde6778fcc652cf6813fefd21db3727454df59ad3be7465d60507aa0121600478d126ce394ef52d6ffc6845672dfcedb14d4cabe76acd9efff25892b31dc32d8bd21426575f08a30b1b84bb8c1f6507810e25d47852f1f2a06b66b5341d02d7481a1cce01257e768aa1a59b683a28f6f7946674541f0f4e23643d31dfd7e90958a361c7db86b628fe075d94c85e2c43f858d3f3683d5369a87f76b3902c0765ddc8c904e375b0f5740db5d2e25f1b159a966e20596b1a38ff311b5365d7709cc679991307d692152cff49876663f315e081f4c0bc85c38a66f2198d5390170c275e23e9843ea74a046b3e7084aaa1d53c6fc6c8622250dcb812d444c341a8470df4b2c2ec3ab0d4aa563b101a31520d71df0c9c1eec4818cbaecb324ac2b9045aeb316bb1f4c6c9aac9247f1ec3fb824247f3858d1b9c6031413a11a7b059';
const keysetHash = '0xf8bb9a67839d1767e79afe52d21e97a04ee0bf5f816d5b52c10df60cccb7f822';
describe('setValidKeysetFunctionSelector/invalidateKeysetFunctionSelector', () => {
  it('getValidKeysets return all keysets', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: [
              mockSetValidKeysetEvent(keysetHashForZeroPK, keysetForZeroPK),
              mockSetValidKeysetEvent(keysetHash, keyset),
              mockInvalidateKeysetHashEvent(keysetHash),
            ],
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

    const { keysets } = await getKeysets(mockClient, {
      sequencerInbox: sequencerInboxAddress,
    });

    expect(keysets).toEqual({
      [keysetHashForZeroPK]: keysetForZeroPK,
    });
  });
});

describe('Detect keysets added or removed multiple times', () => {
  it('when disabling the same keyset multiple time', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: [
              mockInvalidateKeysetHashEvent(keysetHashForZeroPK),
              mockInvalidateKeysetHashEvent(keysetHashForZeroPK),
              mockSetValidKeysetEvent(keysetHashForZeroPK, keysetForZeroPK),
              mockInvalidateKeysetHashEvent(keysetHashForZeroPK),
            ],
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

    const { keysets } = await getKeysets(mockClient, {
      sequencerInbox: sequencerInboxAddress,
    });

    expect(keysets).toEqual({});
  });
  it('when enabling the same keyset multiple time', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: [
              mockSetValidKeysetEvent(keysetHash, keyset),
              mockSetValidKeysetEvent(keysetHash, keyset),
              mockInvalidateKeysetHashEvent(keysetHash),
            ],
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

    const { keysets } = await getKeysets(mockClient, {
      sequencerInbox: sequencerInboxAddress,
    });

    expect(keysets).toEqual({});
  });
  it('when adding an existing keyset', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: [
              mockSetValidKeysetEvent(keysetHash, keyset),
              mockSetValidKeysetEvent(keysetHash, keyset),
            ],
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

    const { keysets } = await getKeysets(mockClient, {
      sequencerInbox: sequencerInboxAddress,
    });

    expect(keysets).toEqual({
      [keysetHash]: keyset,
    });
  });
  it('when removing an existing keyset', async () => {
    const mockTransport = () =>
      createTransport({
        key: 'mock',
        name: 'Mock Transport',
        request: vi.fn(({ method, params }) => {
          return mockData({
            logs: [
              mockInvalidateKeysetHashEvent(keysetHashForZeroPK),
              mockInvalidateKeysetHashEvent(keysetHashForZeroPK),
              mockSetValidKeysetEvent(keysetHashForZeroPK, keysetForZeroPK),
            ],
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

    const { keysets } = await getKeysets(mockClient, {
      sequencerInbox: sequencerInboxAddress,
    });

    expect(keysets).toEqual({
      [keysetHashForZeroPK]: keysetForZeroPK,
    });
  });
});
