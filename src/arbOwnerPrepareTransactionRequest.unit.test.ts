import { it, expect, expectTypeOf } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  InvalidAddressError,
  createPublicClient,
  http,
} from 'viem';
import { nitroTestnodeL2 } from './chains';
import { arbOwnerPublicConfig } from './contracts/ArbOwnerPublic';
import { arbOwnerPrepareTransactionRequest } from './arbOwnerPrepareTransactionRequest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
});
const randomAccount = privateKeyToAccount(generatePrivateKey());

it('Infer parameters based on function name', async () => {
  await expect(
    arbOwnerPrepareTransactionRequest(client, {
      functionName: 'addChainOwner',
      // @ts-expect-error Args are missing
      args: [],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  await expect(
    arbOwnerPrepareTransactionRequest(client, {
      functionName: 'addChainOwner',
      // @ts-expect-error Args are of the wrong type
      args: [10n],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrow(InvalidAddressError);

  await expect(
    arbOwnerPrepareTransactionRequest(client, {
      functionName: 'addChainOwner',
      upgradeExecutor: false,
      account: randomAccount.address,
      // @ts-expect-error Args are required for `addChainOwner`
      args: undefined,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf(arbOwnerPrepareTransactionRequest).toBeCallableWith(client, {
    functionName: 'addChainOwner',
    args: [randomAccount.address],
    upgradeExecutor: false,
    account: randomAccount.address,
  });

  // Function doesn't exist
  await expect(
    client.readContract({
      ...arbOwnerPublicConfig,
      // @ts-expect-error Function not available
      functionName: 'notExisting',
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
