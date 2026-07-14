import { Transport, Chain, PrepareTransactionRequestReturnType, PublicClient, Address } from 'viem';

import { sequencerInboxABI } from '../contracts/SequencerInbox';
import {
  createContractRead,
  ContractReadFunctionName,
  ContractReadParameters,
  ContractReadReturnType,
} from '../contractRead';
import {
  SequencerInboxAbi,
  SequencerInboxFunctionName,
  sequencerInboxPrepareTransactionRequest,
  SequencerInboxPrepareTransactionRequestParameters,
} from '../sequencerInboxPrepareTransactionRequest';

type SequencerInboxAddressParameters = { sequencerInbox: Address };
type SequencerInboxReadFunctionName = ContractReadFunctionName<SequencerInboxAbi>;
type SequencerInboxReadContractParameters<TFunctionName extends SequencerInboxReadFunctionName> =
  ContractReadParameters<SequencerInboxAbi, TFunctionName, SequencerInboxAddressParameters>;
type SequencerInboxReadContractReturnType<TFunctionName extends SequencerInboxReadFunctionName> =
  ContractReadReturnType<SequencerInboxAbi, TFunctionName>;

const sequencerInboxReadContract = createContractRead<
  SequencerInboxAbi,
  SequencerInboxAddressParameters
>(sequencerInboxABI, ({ sequencerInbox }) => sequencerInbox);

type SequencerInboxReadContractArgs<
  TSequencerInbox extends Address | undefined,
  TFunctionName extends SequencerInboxReadFunctionName,
> = TSequencerInbox extends Address
  ? Omit<SequencerInboxReadContractParameters<TFunctionName>, 'sequencerInbox'> & {
      sequencerInbox?: Address;
    }
  : SequencerInboxReadContractParameters<TFunctionName>;
type SequencerInboxPrepareTransactionRequestArgs<
  TSequencerInbox extends Address | undefined,
  TFunctionName extends SequencerInboxFunctionName,
> = TSequencerInbox extends Address
  ? Omit<SequencerInboxPrepareTransactionRequestParameters<TFunctionName>, 'sequencerInbox'> & {
      sequencerInbox?: Address;
    }
  : SequencerInboxPrepareTransactionRequestParameters<TFunctionName>;

export type SequencerInboxActions<
  TSequencerInbox extends Address | undefined,
  TChain extends Chain | undefined = Chain | undefined,
> = {
  sequencerInboxReadContract: <TFunctionName extends SequencerInboxReadFunctionName>(
    args: SequencerInboxReadContractArgs<TSequencerInbox, TFunctionName>,
  ) => Promise<SequencerInboxReadContractReturnType<TFunctionName>>;

  sequencerInboxPrepareTransactionRequest: <TFunctionName extends SequencerInboxFunctionName>(
    args: SequencerInboxPrepareTransactionRequestArgs<TSequencerInbox, TFunctionName>,
  ) => Promise<PrepareTransactionRequestReturnType<TChain> & { chainId: number }>;
};

/**
 * Set of actions that can be performed on the sequencerInbox contract through wagmi public client
 *
 * @param {Object} sequencerInbox - Address of the sequencerInbox core contract
 * User can still overrides sequencerInbox address,
 * by passing it as an argument to sequencerInboxReadContract/sequencerInboxPrepareTransactionRequest calls
 *
 * @returns {Function} sequencerInboxActionsWithSequencerInbox - Function passed to client.extends() to extend the public client
 *
 * @example
 * const client = createPublicClient({
 *   chain: arbitrumOne,
 *   transport: http(),
 * }).extend(sequencerInboxActions(coreContracts.sequencerInbox));
 *
 * // SequencerInbox is set to `coreContracts.sequencerInbox` for every call
 * client.sequencerInboxReadContract({
 *   functionName: 'inboxAccs',
 * });
 *
 * // Overriding sequencerInbox address for this call only
 * client.sequencerInboxReadContract({
 *   functionName: 'inboxAccs',
 *   sequencerInbox: contractAddress.anotherSequencerInbox
 * });
 */

export function sequencerInboxActions<
  TParams extends { sequencerInbox?: Address },
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>({ sequencerInbox }: TParams) {
  return function sequencerInboxActionsWithSequencerInbox(
    client: PublicClient<TTransport, TChain>,
  ) {
    const sequencerInboxExtensions: SequencerInboxActions<TParams['sequencerInbox'], TChain> = {
      sequencerInboxReadContract: <TFunctionName extends SequencerInboxReadFunctionName>(
        args: SequencerInboxReadContractArgs<TParams['sequencerInbox'], TFunctionName>,
      ) => {
        return sequencerInboxReadContract(client, {
          ...args,
          sequencerInbox: args.sequencerInbox || sequencerInbox,
        } as SequencerInboxReadContractParameters<TFunctionName>);
      },
      sequencerInboxPrepareTransactionRequest: <TFunctionName extends SequencerInboxFunctionName>(
        args: SequencerInboxPrepareTransactionRequestArgs<TParams['sequencerInbox'], TFunctionName>,
      ) => {
        return sequencerInboxPrepareTransactionRequest(client, {
          ...args,
          sequencerInbox: args.sequencerInbox || sequencerInbox,
        } as SequencerInboxPrepareTransactionRequestParameters<TFunctionName>);
      },
    };
    return sequencerInboxExtensions;
  };
}
