import { Transport, Chain, PrepareTransactionRequestReturnType, PublicClient } from 'viem';

import { arbOwnerPublicABI, arbOwnerPublicAddress } from '../contracts/ArbOwnerPublic';
import {
  createContractRead,
  ContractReadFunctionName,
  ContractReadParameters,
  ContractReadReturnType,
} from '../contractRead';
import {
  arbOwnerPrepareTransactionRequest,
  ArbOwnerPrepareTransactionRequestFunctionName,
  ArbOwnerPrepareTransactionRequestParameters,
} from '../arbOwnerPrepareTransactionRequest';

type ArbOwnerPublicFunctionName = ContractReadFunctionName<typeof arbOwnerPublicABI>;
type ArbOwnerReadContractParameters<TFunctionName extends ArbOwnerPublicFunctionName> =
  ContractReadParameters<typeof arbOwnerPublicABI, TFunctionName>;
type ArbOwnerReadContractReturnType<TFunctionName extends ArbOwnerPublicFunctionName> =
  ContractReadReturnType<typeof arbOwnerPublicABI, TFunctionName>;

const arbOwnerReadContract = createContractRead<typeof arbOwnerPublicABI>(
  arbOwnerPublicABI,
  () => arbOwnerPublicAddress,
);

export type ArbOwnerPublicActions<TChain extends Chain | undefined = Chain | undefined> = {
  arbOwnerReadContract: <TFunctionName extends ArbOwnerPublicFunctionName>(
    args: ArbOwnerReadContractParameters<TFunctionName>,
  ) => Promise<ArbOwnerReadContractReturnType<TFunctionName>>;

  arbOwnerPrepareTransactionRequest: <
    TFunctionName extends ArbOwnerPrepareTransactionRequestFunctionName,
  >(
    args: ArbOwnerPrepareTransactionRequestParameters<TFunctionName>,
  ) => Promise<PrepareTransactionRequestReturnType<TChain> & { chainId: number }>;
};

export function arbOwnerPublicActions<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(client: PublicClient<TTransport, TChain>): ArbOwnerPublicActions<TChain> {
  return {
    arbOwnerReadContract: (args) => arbOwnerReadContract(client, args),

    arbOwnerPrepareTransactionRequest: (args) => arbOwnerPrepareTransactionRequest(client, args),
  };
}
