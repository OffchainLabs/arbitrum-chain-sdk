import { it, expect, expectTypeOf, describe } from 'vitest';

import {
  AbiEncodingLengthMismatchError,
  AbiFunctionNotFoundError,
  InvalidAddressError,
  createPublicClient,
  http,
} from 'viem';
import { nitroTestnodeL2 } from '../chains';
import { sequencerInboxActions } from './sequencerInboxActions';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const l3SequencerInbox = '0x42b5da0625cf278067955f07045f63cafd79274f';

const client = createPublicClient({
  chain: nitroTestnodeL2,
  transport: http(),
}).extend(sequencerInboxActions({ sequencerInbox: l3SequencerInbox }));

const randomAccount = privateKeyToAccount(generatePrivateKey());

describe('SequencerInbox parameter:', () => {
  it('require sequencerInbox parameter if not passed initially to the actions during initialization', () => {
    const clientWithoutSequencerInboxAddress = createPublicClient({
      chain: nitroTestnodeL2,
      transport: http(),
    }).extend(sequencerInboxActions({}));

    // @ts-expect-error sequencerInbox is required
    clientWithoutSequencerInboxAddress.sequencerInboxReadContract({
      functionName: 'inboxAccs',
      args: [10n],
    });
  });

  it('Doesn`t require sequencerInbox parameter if passed initially to the actions during initialization', () => {
    const clientWithSequencerInboxAddress = createPublicClient({
      chain: nitroTestnodeL2,
      transport: http(),
    }).extend(sequencerInboxActions({ sequencerInbox: l3SequencerInbox }));

    clientWithSequencerInboxAddress.sequencerInboxReadContract({
      functionName: 'inboxAccs',
      args: [10n],
    });
  });

  it('Allow sequencerInbox override parameter if passed initially to the actions during initialization', () => {
    const clientWithSequencerInboxAddress = createPublicClient({
      chain: nitroTestnodeL2,
      transport: http(),
    }).extend(sequencerInboxActions({ sequencerInbox: l3SequencerInbox }));

    clientWithSequencerInboxAddress.sequencerInboxReadContract({
      functionName: 'inboxAccs',
      args: [10n],
      sequencerInbox: randomAccount.address,
    });
  });
});

it('Infer parameters based on function name', async () => {
  await expect(
    client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setIsBatchPoster',
      // @ts-expect-error Args are missing
      args: [],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrowError(AbiEncodingLengthMismatchError);

  await expect(
    client.sequencerInboxPrepareTransactionRequest({
      functionName: 'setIsBatchPoster',
      // @ts-expect-error Args are of the wrong type
      args: [10n, true],
      upgradeExecutor: false,
      account: randomAccount.address,
    }),
  ).rejects.toThrowError(InvalidAddressError);

  await expect(
    client
      // @ts-expect-error Args are required for `setIsBatchPoster`
      .sequencerInboxPrepareTransactionRequest({
        functionName: 'setIsBatchPoster',
        upgradeExecutor: false,
        account: randomAccount.address,
      }),
  ).rejects.toThrow(AbiEncodingLengthMismatchError);

  expectTypeOf<
    typeof client.sequencerInboxPrepareTransactionRequest<'setIsBatchPoster'>
  >().toBeCallableWith({
    functionName: 'setIsBatchPoster',
    args: [randomAccount.address, true],
    upgradeExecutor: false,
    account: randomAccount.address,
  });

  // Function doesn't exist
  await expect(
    client.sequencerInboxPrepareTransactionRequest({
      // @ts-expect-error Function not available
      functionName: 'notExisting',
    }),
  ).rejects.toThrowError(AbiFunctionNotFoundError);
});
