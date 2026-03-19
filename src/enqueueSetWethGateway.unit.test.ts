import { it, expect, vi, describe } from 'vitest';
import { Address, PublicClient, zeroAddress } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

import { enqueueSetWethGateway } from './enqueueSetWethGateway';

// vi.mock factories are hoisted, so addresses must be defined via vi.hoisted
const {
  rollupAddress,
  account,
  tokenBridgeCreatorAddr,
  mockInboxAddress,
  mockBridgeAddress,
  mockRouterAddress,
  mockWethAddress,
  mockWethGatewayAddress,
  mockUpgradeExecutorAddress,
} = vi.hoisted(() => ({
  rollupAddress: '0x1111111111111111111111111111111111111111' as Address,
  account: '0x3333333333333333333333333333333333333333' as Address,
  tokenBridgeCreatorAddr: '0x4444444444444444444444444444444444444444' as Address,
  mockInboxAddress: '0x5555555555555555555555555555555555555555' as Address,
  mockBridgeAddress: '0x6666666666666666666666666666666666666666' as Address,
  mockRouterAddress: '0x7777777777777777777777777777777777777777' as Address,
  mockWethAddress: '0x8888888888888888888888888888888888888888' as Address,
  mockWethGatewayAddress: '0x9999999999999999999999999999999999999999' as Address,
  mockUpgradeExecutorAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
}));

vi.mock('./utils/isCustomFeeTokenChain', () => ({
  isCustomFeeTokenChain: vi.fn().mockResolvedValue(false),
}));

vi.mock('./createTokenBridgeFetchTokenBridgeContracts', () => ({
  createTokenBridgeFetchTokenBridgeContracts: vi.fn().mockResolvedValue({
    parentChainContracts: {
      router: mockRouterAddress,
      standardGateway: '0x0000000000000000000000000000000000000000',
      customGateway: '0x0000000000000000000000000000000000000000',
      wethGateway: mockWethGatewayAddress,
      weth: mockWethAddress,
      multicall: '0x0000000000000000000000000000000000000000',
    },
    orbitChainContracts: {
      router: '0x0000000000000000000000000000000000000000',
      standardGateway: '0x0000000000000000000000000000000000000000',
      customGateway: '0x0000000000000000000000000000000000000000',
      wethGateway: '0x0000000000000000000000000000000000000000',
      weth: '0x0000000000000000000000000000000000000000',
      proxyAdmin: '0x0000000000000000000000000000000000000000',
      beaconProxyFactory: '0x0000000000000000000000000000000000000000',
      upgradeExecutor: '0x0000000000000000000000000000000000000000',
      multicall: '0x0000000000000000000000000000000000000000',
    },
  }),
}));

vi.mock('./createRollupFetchCoreContracts', () => ({
  createRollupFetchCoreContracts: vi.fn().mockResolvedValue({
    upgradeExecutor: mockUpgradeExecutorAddress,
    rollup: rollupAddress,
    inbox: mockInboxAddress,
    outbox: '0x0000000000000000000000000000000000000000',
    adminProxy: '0x0000000000000000000000000000000000000000',
    sequencerInbox: '0x0000000000000000000000000000000000000000',
    bridge: mockBridgeAddress,
    validatorUtils: '0x0000000000000000000000000000000000000000',
    validatorWalletCreator: '0x0000000000000000000000000000000000000000',
    deployedAtBlockNumber: 0n,
  }),
}));

function createMockClient({
  registeredWethGateway = zeroAddress,
}: {
  registeredWethGateway?: Address;
} = {}) {
  const readContract = vi.fn().mockImplementation(({ functionName }: { functionName: string }) => {
    if (functionName === 'inbox') return mockInboxAddress;
    if (functionName === 'l1TokenToGateway') return registeredWethGateway;
    throw new Error(`Unexpected readContract call: ${functionName}`);
  });

  const prepareTransactionRequest = vi.fn().mockResolvedValue({
    to: mockUpgradeExecutorAddress,
    data: '0x',
    value: 0n,
    gas: 500_000n,
    account,
    from: account,
    nonce: 0,
    maxFeePerGas: 1_000_000_000n,
    maxPriorityFeePerGas: 0n,
  });

  return {
    chain: arbitrumSepolia,
    readContract,
    prepareTransactionRequest,
  } as unknown as PublicClient;
}

describe('enqueueSetWethGateway', () => {
  it('returns tx routed through UpgradeExecutor with correct deposit', async () => {
    const client = createMockClient();
    const gasLimit = 100_000n;
    const maxFeePerGas = 200_000_000n;
    const maxSubmissionCost = 50_000n;

    const result = await enqueueSetWethGateway({
      rollup: rollupAddress,
      account,
      parentChainPublicClient: client,
      gasLimit,
      maxFeePerGas,
      maxSubmissionCost,
      tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
    });

    expect(result.chainId).toEqual(arbitrumSepolia.id);

    const mockClient = client as unknown as { prepareTransactionRequest: ReturnType<typeof vi.fn> };
    const prepareCall = mockClient.prepareTransactionRequest.mock.calls[0][0];
    expect(prepareCall.to).toEqual(mockUpgradeExecutorAddress);

    const expectedDeposit = gasLimit * maxFeePerGas + maxSubmissionCost;
    expect(prepareCall.value).toEqual(expectedDeposit);
  });

  it('deposit equals gasLimit * maxFeePerGas + maxSubmissionCost', async () => {
    const client = createMockClient();
    const gasLimit = 500_000n;
    const maxFeePerGas = 300_000_000n;
    const maxSubmissionCost = 100_000n;

    await enqueueSetWethGateway({
      rollup: rollupAddress,
      account,
      parentChainPublicClient: client,
      gasLimit,
      maxFeePerGas,
      maxSubmissionCost,
      tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
    });

    const mockClient = client as unknown as { prepareTransactionRequest: ReturnType<typeof vi.fn> };
    const prepareCall = mockClient.prepareTransactionRequest.mock.calls[0][0];
    expect(prepareCall.value).toEqual(gasLimit * maxFeePerGas + maxSubmissionCost);
  });

  it('throws if custom fee token chain', async () => {
    const { isCustomFeeTokenChain } = await import('./utils/isCustomFeeTokenChain');
    vi.mocked(isCustomFeeTokenChain).mockResolvedValueOnce(true);

    const client = createMockClient();

    await expect(
      enqueueSetWethGateway({
        rollup: rollupAddress,
        account,
        parentChainPublicClient: client,
        gasLimit: 100_000n,
        maxSubmissionCost: 50_000n,
        tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
      }),
    ).rejects.toThrowError('chain is custom fee token chain, no need to register the weth gateway.');
  });

  it('throws if WETH gateway already registered', async () => {
    const client = createMockClient({ registeredWethGateway: mockWethGatewayAddress });

    await expect(
      enqueueSetWethGateway({
        rollup: rollupAddress,
        account,
        parentChainPublicClient: client,
        gasLimit: 100_000n,
        maxSubmissionCost: 50_000n,
        tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
      }),
    ).rejects.toThrowError('weth gateway is already registered in the router.');
  });
});
