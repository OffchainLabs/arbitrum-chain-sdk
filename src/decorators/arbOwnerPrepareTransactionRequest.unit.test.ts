import { it, expect, expectTypeOf } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  InvalidAddressError,
  createPublicClient,
  http,
} from 'viem';
import { nitroTestnodeL2 } from '../chains';
import { arbOwnerPublicActions } from './arbOwnerPublicActions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
}).extend(arbOwnerPublicActions);
const randomAccount = privateKeyToAccount(generatePrivateKey());

it('Infer parameters based on function name', async () => {
  await expect(
    client.arbOwnerPrepareTransactionRequest({
      functionName: 'addChainOwner',
      // @ts-expect-error empty args not assignable to addChainOwner's [Address]
      args: [],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  await expect(
    // @ts-expect-error [bigint] not assignable to addChainOwner's [Address]
    client.arbOwnerPrepareTransactionRequest({
      functionName: 'addChainOwner',
      args: [10n],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrow(InvalidAddressError);

  await expect(
    // @ts-expect-error args required for addChainOwner but missing
    client.arbOwnerPrepareTransactionRequest({
      functionName: 'addChainOwner',
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf(client.arbOwnerPrepareTransactionRequest).toBeCallableWith({
    functionName: 'addChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: randomAccount.address,
  });

  // Function doesn't exist
  await expect(
    client.arbOwnerReadContract({
      // @ts-expect-error functionName 'notExisting' not in ABI
      functionName: 'notExisting',
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
