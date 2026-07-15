import { it, expect, expectTypeOf } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  InvalidAddressError,
  createPublicClient,
  http,
} from 'viem';
import { rollupAdminLogicPrepareTransactionRequest } from './rollupAdminLogicPrepareTransactionRequest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const rollupAdminLogicAddress = '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35';

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

const randomAccount = privateKeyToAccount(generatePrivateKey());

it('requires the Rollup address', () => {
  if (false) {
    // @ts-expect-error rollup is required
    rollupAdminLogicPrepareTransactionRequest(client, {
      functionName: 'setLoserStakeEscrow',
      args: [randomAccount.address],
      upgradeExecutor: false,
      account: randomAccount.address,
    });
  }

  expectTypeOf(rollupAdminLogicPrepareTransactionRequest).toBeCallableWith(client, {
    functionName: 'setLoserStakeEscrow',
    args: [randomAccount.address],
    rollup: rollupAdminLogicAddress,
    upgradeExecutor: false,
    account: randomAccount.address,
  });
});

it('Infer parameters based on function name', async () => {
  await expect(
    rollupAdminLogicPrepareTransactionRequest(client, {
      functionName: 'setLoserStakeEscrow',
      // @ts-expect-error Args are missing
      args: [],
      upgradeExecutor: false,
      account: randomAccount.address,
      rollup: rollupAdminLogicAddress,
    }),
  ).rejects.toThrowError(AbiEncodingLengthMismatchError);

  await expect(
    rollupAdminLogicPrepareTransactionRequest(client, {
      functionName: 'setLoserStakeEscrow',
      // @ts-expect-error Args are of the wrong type
      args: [true],
      upgradeExecutor: false,
      account: randomAccount.address,
      rollup: rollupAdminLogicAddress,
    }),
  ).rejects.toThrowError(InvalidAddressError);

  await expect(
    rollupAdminLogicPrepareTransactionRequest(client, {
      functionName: 'setLoserStakeEscrow',
      upgradeExecutor: false,
      account: randomAccount.address,
      rollup: rollupAdminLogicAddress,
      // @ts-expect-error Args are required for `setLoserStakeEscrow`
      args: undefined,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf(rollupAdminLogicPrepareTransactionRequest).toBeCallableWith(client, {
    functionName: 'setLoserStakeEscrow',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: randomAccount.address,
    rollup: rollupAdminLogicAddress,
  });

  // Function doesn't exist
  await expect(
    rollupAdminLogicPrepareTransactionRequest(client, {
      // @ts-expect-error Function not available
      functionName: 'notExisting',
      upgradeExecutor: false,
      account: randomAccount.address,
      rollup: rollupAdminLogicAddress,
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
