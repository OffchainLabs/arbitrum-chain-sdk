import { it, expect, expectTypeOf, describe, vi } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  InvalidAddressError,
  createPublicClient,
  http,
  createClient,
  ClientConfig,
} from 'viem';
import { rollupAdminLogicPublicActions } from './rollupAdminLogicPublicActions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory';
import { mainnet } from 'viem/chains';

const rollupAdminLogicAddress = '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35';

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
}).extend(rollupAdminLogicPublicActions({ rollup: rollupAdminLogicAddress }));

const randomAccount = privateKeyToAccount(generatePrivateKey());

// Mock readContract (called internally with client.rollupAdminLogicReadContract)
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

describe('RollupAdminLogic parameter:', () => {
  it('require rollupAdminLogic parameter if not passed initially to the actions during initialization', () => {
    const clientWithoutRollupAdminLogicAddress = createPublicClient({
      chain: mainnet,
      transport: http(),
    }).extend(rollupAdminLogicPublicActions({}));

    // @ts-expect-error rollup is required when not curried
    clientWithoutRollupAdminLogicAddress.rollupAdminLogicReadContract({
      functionName: 'amountStaked',
      args: [randomAccount.address],
    });

    expectTypeOf(
      clientWithoutRollupAdminLogicAddress.rollupAdminLogicReadContract,
    ).toBeCallableWith({
      functionName: 'amountStaked',
      args: [randomAccount.address],
      rollup: rollupAdminLogicAddress,
    });
  });

  it("Doesn't require rollupAdminLogic parameter if passed initially to the actions during initialization", async () => {
    const clientWithRollupAdminLogicAddress = createPublicClient({
      chain: mainnet,
      transport: http(),
    }).extend(rollupAdminLogicPublicActions({ rollup: rollupAdminLogicAddress }));

    expectTypeOf(clientWithRollupAdminLogicAddress.rollupAdminLogicReadContract).toBeCallableWith({
      functionName: 'amountStaked',
      args: [randomAccount.address],
    });

    await clientWithRollupAdminLogicAddress.rollupAdminLogicReadContract({
      functionName: 'amountStaked',
      args: [randomAccount.address],
    });

    expect(clientWithRollupAdminLogicAddress.readContract).toHaveBeenCalledWith({
      address: rollupAdminLogicAddress,
      abi: RollupAdminLogic__factory.abi,
      functionName: 'amountStaked',
      args: [randomAccount.address],
    });
  });

  it('Allow rollupAdminLogic override parameter if passed initially to the actions during initialization', async () => {
    const clientWithRollupAdminLogicAddress = createPublicClient({
      chain: mainnet,
      transport: http(),
    }).extend(rollupAdminLogicPublicActions({ rollup: rollupAdminLogicAddress }));

    expectTypeOf(clientWithRollupAdminLogicAddress.rollupAdminLogicReadContract).toBeCallableWith({
      functionName: 'amountStaked',
      args: [randomAccount.address],
      rollup: rollupAdminLogicAddress,
    });

    await clientWithRollupAdminLogicAddress.rollupAdminLogicReadContract({
      functionName: 'amountStaked',
      args: [randomAccount.address],
      rollup: randomAccount.address,
    });

    expect(clientWithRollupAdminLogicAddress.readContract).toHaveBeenCalledWith({
      address: randomAccount.address,
      abi: RollupAdminLogic__factory.abi,
      functionName: 'amountStaked',
      args: [randomAccount.address],
    });
  });
});

it('Infer parameters based on function name', async () => {
  await expect(
    // @ts-expect-error empty args not assignable to setLoserStakeEscrow's [Address]
    client.rollupAdminLogicPrepareTransactionRequest({
      functionName: 'setLoserStakeEscrow',
      args: [],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrowError(AbiEncodingLengthMismatchError);

  await expect(
    // @ts-expect-error [boolean] not assignable to setLoserStakeEscrow's [Address]
    client.rollupAdminLogicPrepareTransactionRequest({
      functionName: 'setLoserStakeEscrow',
      args: [true],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrowError(InvalidAddressError);

  await expect(
    // @ts-expect-error args required for setLoserStakeEscrow but missing
    client.rollupAdminLogicPrepareTransactionRequest({
      functionName: 'setLoserStakeEscrow',
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf(client.rollupAdminLogicPrepareTransactionRequest).toBeCallableWith({
    functionName: 'setLoserStakeEscrow',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: randomAccount.address,
  });

  // Function doesn't exist
  await expect(
    client.rollupAdminLogicPrepareTransactionRequest({
      // @ts-expect-error functionName 'notExisting' not in ABI
      functionName: 'notExisting',
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
