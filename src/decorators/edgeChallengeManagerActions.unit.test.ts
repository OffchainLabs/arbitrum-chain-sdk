import { it, expect, expectTypeOf, describe, vi } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  createPublicClient,
  http,
  createClient,
  ClientConfig,
} from 'viem';
import { edgeChallengeManagerActions } from './edgeChallengeManagerActions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { edgeChallengeManagerABI } from '../contracts/EdgeChallengeManager';
import { mainnet } from 'viem/chains';

const challengeManagerAddress = '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35';

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
}).extend(edgeChallengeManagerActions({ challengeManager: challengeManagerAddress }));

const randomAccount = privateKeyToAccount(generatePrivateKey());

// Mock readContract (called internally with client.edgeChallengeManagerReadContract)
vi.mock('viem', async () => {
  const viem: Record<string, unknown> = await vi.importActual('viem');

  return {
    ...viem,
    createPublicClient: (args: ClientConfig) => {
      const client = createClient(args);
      Object.assign(client, {
        readContract: vi.fn(),
      });
      return client;
    },
  };
});

describe('EdgeChallengeManager parameter:', () => {
  it('require challengeManager parameter if not passed initially to the actions during initialization', () => {
    const clientWithoutChallengeManagerAddress = createPublicClient({
      chain: mainnet,
      transport: http(),
    }).extend(edgeChallengeManagerActions({}));

    // @ts-expect-error challengeManager is required
    clientWithoutChallengeManagerAddress.edgeChallengeManagerReadContract({
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
    });

    expectTypeOf<
      typeof clientWithoutChallengeManagerAddress.edgeChallengeManagerReadContract<'edgeExists'>
    >().toBeCallableWith({
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
      challengeManager: challengeManagerAddress,
    });
  });

  it("Doesn't require challengeManager parameter if passed initially to the actions during initialization", async () => {
    const clientWithChallengeManagerAddress = createPublicClient({
      chain: mainnet,
      transport: http(),
    }).extend(edgeChallengeManagerActions({ challengeManager: challengeManagerAddress }));

    expectTypeOf<
      typeof clientWithChallengeManagerAddress.edgeChallengeManagerReadContract<'edgeExists'>
    >().toBeCallableWith({
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
    });

    await clientWithChallengeManagerAddress.edgeChallengeManagerReadContract({
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
    });

    expect(clientWithChallengeManagerAddress.readContract).toHaveBeenCalledWith({
      address: challengeManagerAddress,
      abi: edgeChallengeManagerABI,
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
    });
  });

  it('Allow challengeManager override parameter if passed initially to the actions during initialization', async () => {
    const clientWithChallengeManagerAddress = createPublicClient({
      chain: mainnet,
      transport: http(),
    }).extend(edgeChallengeManagerActions({ challengeManager: challengeManagerAddress }));

    expectTypeOf<
      typeof clientWithChallengeManagerAddress.edgeChallengeManagerReadContract<'edgeExists'>
    >().toBeCallableWith({
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
      challengeManager: challengeManagerAddress,
    });

    await clientWithChallengeManagerAddress.edgeChallengeManagerReadContract({
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
      challengeManager: randomAccount.address,
    });

    expect(clientWithChallengeManagerAddress.readContract).toHaveBeenCalledWith({
      address: randomAccount.address,
      abi: edgeChallengeManagerABI,
      functionName: 'edgeExists',
      args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
    });
  });
});

it('Infer parameters based on function name', async () => {
  await expect(
    client.edgeChallengeManagerPrepareTransactionRequest({
      functionName: 'refundStake',
      // @ts-expect-error Args are missing
      args: [],
      account: randomAccount.address,
    }),
  ).rejects.toThrowError(AbiEncodingLengthMismatchError);

  await expect(
    client
      // @ts-expect-error Args are required for `refundStake`
      .edgeChallengeManagerPrepareTransactionRequest({
        functionName: 'refundStake',
        account: randomAccount.address,
      }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf<
    typeof client.edgeChallengeManagerPrepareTransactionRequest<'refundStake'>
  >().toBeCallableWith({
    functionName: 'refundStake',
    args: ['0x0000000000000000000000000000000000000000000000000000000000000001'],
    account: randomAccount.address,
  });

  // Function doesn't exist
  await expect(
    client.edgeChallengeManagerPrepareTransactionRequest({
      // @ts-expect-error Function not available
      functionName: 'notExisting',
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
