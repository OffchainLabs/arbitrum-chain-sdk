import { it, expect, expectTypeOf } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  InvalidAddressError,
  createPublicClient,
  http,
} from 'viem';
import { nitroTestnodeL2 } from './chains';
import { sequencerInboxPrepareTransactionRequest } from './sequencerInboxPrepareTransactionRequest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const l3SequencerInbox = '0x42b5da0625cf278067955f07045f63cafd79274f';

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
});

const randomAccount = privateKeyToAccount(generatePrivateKey());

it('requires the SequencerInbox address', () => {
  if (false) {
    // @ts-expect-error sequencerInbox is required
    sequencerInboxPrepareTransactionRequest(client, {
      functionName: 'setIsBatchPoster',
      args: [randomAccount.address, true],
      upgradeExecutor: false,
      account: randomAccount.address,
    });
  }

  expectTypeOf(sequencerInboxPrepareTransactionRequest).toBeCallableWith(client, {
    functionName: 'setIsBatchPoster',
    args: [randomAccount.address, true],
    sequencerInbox: l3SequencerInbox,
    upgradeExecutor: false,
    account: randomAccount.address,
  });
});

it('Infer parameters based on function name', async () => {
  await expect(
    sequencerInboxPrepareTransactionRequest(client, {
      functionName: 'setIsBatchPoster',
      // @ts-expect-error Args are missing
      args: [],
      upgradeExecutor: false,
      account: randomAccount.address,
      sequencerInbox: l3SequencerInbox,
    }),
  ).rejects.toThrowError(AbiEncodingLengthMismatchError);

  await expect(
    sequencerInboxPrepareTransactionRequest(client, {
      functionName: 'setIsBatchPoster',
      // @ts-expect-error Args are of the wrong type
      args: [10n, true],
      upgradeExecutor: false,
      account: randomAccount.address,
      sequencerInbox: l3SequencerInbox,
    }),
  ).rejects.toThrowError(InvalidAddressError);

  await expect(
    sequencerInboxPrepareTransactionRequest(client, {
      functionName: 'setIsBatchPoster',
      upgradeExecutor: false,
      account: randomAccount.address,
      sequencerInbox: l3SequencerInbox,
      // @ts-expect-error Args are required for `setIsBatchPoster`
      args: undefined,
    }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf(sequencerInboxPrepareTransactionRequest).toBeCallableWith(client, {
    functionName: 'setIsBatchPoster',
    args: [randomAccount.address, true],
    upgradeExecutor: false,
    account: randomAccount.address,
    sequencerInbox: l3SequencerInbox,
  });

  // Function doesn't exist
  await expect(
    sequencerInboxPrepareTransactionRequest(client, {
      // @ts-expect-error Function not available
      functionName: 'notExisting',
      upgradeExecutor: false,
      account: randomAccount.address,
      sequencerInbox: l3SequencerInbox,
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
