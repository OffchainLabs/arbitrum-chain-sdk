import { it, expect, vi, describe } from 'vitest';
import {
  Address,
  PublicClient,
  zeroAddress,
  encodeFunctionData,
} from 'viem';
import { arbitrumSepolia } from 'viem/chains';

import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';
import { enqueueTokenBridgeDeployment } from './enqueueTokenBridgeDeployment';
import { enqueueDefaultMaxGasPrice } from './constants';

const rollupAddress = '0x1111111111111111111111111111111111111111' as Address;
const rollupOwner = '0x2222222222222222222222222222222222222222' as Address;
const account = '0x3333333333333333333333333333333333333333' as Address;
const tokenBridgeCreatorAddr = '0x4444444444444444444444444444444444444444' as Address;
const mockInboxAddress = '0x5555555555555555555555555555555555555555' as Address;
const mockBridgeAddress = '0x6666666666666666666666666666666666666666' as Address;
const nineZeroAddresses = Array(9).fill(zeroAddress) as Address[];

function createMockClient({
  inboxToL2DeploymentRouter = zeroAddress,
  isCustomFeeToken = false,
}: {
  inboxToL2DeploymentRouter?: Address;
  isCustomFeeToken?: boolean;
} = {}) {
  const readContract = vi.fn().mockImplementation(({ functionName }: { functionName: string }) => {
    if (functionName === 'inbox') return mockInboxAddress;
    if (functionName === 'inboxToL2Deployment') {
      return [inboxToL2DeploymentRouter, ...nineZeroAddresses.slice(1)];
    }
    if (functionName === 'bridge') return mockBridgeAddress;
    if (functionName === 'nativeToken') {
      if (!isCustomFeeToken) throw new Error('revert');
      return '0x7777777777777777777777777777777777777777';
    }
    throw new Error(`Unexpected readContract call: ${functionName}`);
  });

  const prepareTransactionRequest = vi.fn().mockResolvedValue({
    to: tokenBridgeCreatorAddr,
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

describe('enqueueTokenBridgeDeployment', () => {
  it('returns correctly encoded tx with expected value and calldata', async () => {
    const client = createMockClient();
    const retryableFee = 1_000_000n;

    const result = await enqueueTokenBridgeDeployment({
      rollup: rollupAddress,
      rollupOwner,
      account,
      parentChainPublicClient: client,
      maxGasForContracts: 6_000_000n,
      retryableFee,
      gasOverrides: { gasLimit: { base: 1_000n } },
      tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
    });

    expect(result.chainId).toEqual(arbitrumSepolia.id);
    expect(result.gas).toEqual(1_000n);

    // Verify prepareTransactionRequest was called with correct args
    const mockClient = client as unknown as { prepareTransactionRequest: ReturnType<typeof vi.fn> };
    const prepareCall = mockClient.prepareTransactionRequest.mock.calls[0][0];
    expect(prepareCall.to).toEqual(tokenBridgeCreatorAddr);
    expect(prepareCall.value).toEqual(retryableFee);
    expect(prepareCall.account).toEqual(account);

    // Verify calldata encodes createTokenBridge correctly
    const expectedData = encodeFunctionData({
      abi: tokenBridgeCreatorABI,
      functionName: 'createTokenBridge',
      args: [mockInboxAddress, rollupOwner, 6_000_000n, enqueueDefaultMaxGasPrice],
    });
    expect(prepareCall.data).toEqual(expectedData);
  });

  it('throws if bridge already deployed (non-zero router from inboxToL2Deployment)', async () => {
    const nonZeroRouter = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
    const client = createMockClient({ inboxToL2DeploymentRouter: nonZeroRouter });

    await expect(
      enqueueTokenBridgeDeployment({
        rollup: rollupAddress,
        rollupOwner,
        account,
        parentChainPublicClient: client,
        maxGasForContracts: 6_000_000n,
        retryableFee: 1_000_000n,
        tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
      }),
    ).rejects.toThrowError(
      `Token bridge contracts for Rollup ${rollupAddress} are already deployed`,
    );
  });

  it('sets value to 0n for custom fee token chains', async () => {
    const client = createMockClient({ isCustomFeeToken: true });

    await enqueueTokenBridgeDeployment({
      rollup: rollupAddress,
      rollupOwner,
      account,
      parentChainPublicClient: client,
      maxGasForContracts: 6_000_000n,
      retryableFee: 1_000_000n,
      gasOverrides: { gasLimit: { base: 1_000n } },
      tokenBridgeCreatorAddressOverride: tokenBridgeCreatorAddr,
    });

    const mockClient = client as unknown as { prepareTransactionRequest: ReturnType<typeof vi.fn> };
    const prepareCall = mockClient.prepareTransactionRequest.mock.calls[0][0];
    expect(prepareCall.value).toEqual(0n);
  });
});
