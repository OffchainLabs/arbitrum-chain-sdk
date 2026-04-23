import { Transport, Chain, PublicClient, Address } from 'viem';
import { PrepareTransactionRequestReturnTypeWithChainId } from '../types/Actions';

import {
  sequencerInboxReadContract,
  SequencerInboxReadContractParameters,
  SequencerInboxReadContractReturnType,
} from '../sequencerInboxReadContract';
import {
  sequencerInboxPrepareTransactionRequest,
  SequencerInboxPrepareTransactionRequestParameters,
} from '../sequencerInboxPrepareTransactionRequest';

// Distribute `Omit<..., 'sequencerInbox'>` over a union so every branch keeps its
// discriminant after the conditional type.
type DistributeOmitSequencerInbox<T> = T extends unknown ? Omit<T, 'sequencerInbox'> : never;

type SequencerInboxReadContractArgs<TSequencerInbox extends Address | undefined> =
  TSequencerInbox extends Address
    ? DistributeOmitSequencerInbox<SequencerInboxReadContractParameters> & {
        sequencerInbox?: Address;
      }
    : SequencerInboxReadContractParameters;

type SequencerInboxPrepareTransactionRequestArgs<TSequencerInbox extends Address | undefined> =
  TSequencerInbox extends Address
    ? DistributeOmitSequencerInbox<SequencerInboxPrepareTransactionRequestParameters> & {
        sequencerInbox?: Address;
      }
    : SequencerInboxPrepareTransactionRequestParameters;

export type SequencerInboxActions<TSequencerInbox extends Address | undefined> = {
  sequencerInboxReadContract: (
    args: SequencerInboxReadContractArgs<TSequencerInbox>,
  ) => Promise<SequencerInboxReadContractReturnType>;

  sequencerInboxPrepareTransactionRequest: (
    args: SequencerInboxPrepareTransactionRequestArgs<TSequencerInbox>,
  ) => Promise<PrepareTransactionRequestReturnTypeWithChainId>;
};

export function sequencerInboxActions<
  TParams extends { sequencerInbox?: Address },
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>({ sequencerInbox }: TParams) {
  return function sequencerInboxActionsWithSequencerInbox(
    client: PublicClient<TTransport, TChain>,
  ): SequencerInboxActions<TParams['sequencerInbox']> {
    return {
      sequencerInboxReadContract: (args) => {
        return sequencerInboxReadContract(client, {
          ...args,
          sequencerInbox: (args.sequencerInbox ?? sequencerInbox) as Address,
        });
      },
      sequencerInboxPrepareTransactionRequest: (args) => {
        return sequencerInboxPrepareTransactionRequest(client, {
          ...args,
          sequencerInbox: (args.sequencerInbox ?? sequencerInbox) as Address,
        });
      },
    };
  };
}
