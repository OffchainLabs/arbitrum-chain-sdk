import { Transport, Chain, PublicClient } from 'viem';

import {
  arbOwnerReadContract,
  ArbOwnerReadContractParameters,
  ArbOwnerReadContractReturnType,
} from '../arbOwnerReadContract';
import {
  arbOwnerPrepareTransactionRequest,
  ArbOwnerPrepareTransactionRequestFullParams,
} from '../arbOwnerPrepareTransactionRequest';
import { PrepareTransactionRequestReturnTypeWithChainId } from '../types/Actions';

export type ArbOwnerPublicActions = {
  arbOwnerReadContract: (
    args: ArbOwnerReadContractParameters,
  ) => Promise<ArbOwnerReadContractReturnType>;

  arbOwnerPrepareTransactionRequest: (
    args: ArbOwnerPrepareTransactionRequestFullParams,
  ) => Promise<PrepareTransactionRequestReturnTypeWithChainId>;
};

export function arbOwnerPublicActions<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(client: PublicClient<TTransport, TChain>): ArbOwnerPublicActions {
  return {
    arbOwnerReadContract: (args) => arbOwnerReadContract(client, args),
    arbOwnerPrepareTransactionRequest: (args) => arbOwnerPrepareTransactionRequest(client, args),
  };
}
