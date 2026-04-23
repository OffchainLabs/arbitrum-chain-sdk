import { Transport, Chain, PublicClient } from 'viem';

import {
  arbAggregatorReadContract,
  ArbAggregatorReadContractParameters,
  ArbAggregatorReadContractReturnType,
} from '../arbAggregatorReadContract';
import {
  arbAggregatorPrepareTransactionRequest,
  ArbAggregatorPrepareTransactionRequestParameters,
} from '../arbAggregatorPrepareTransactionRequest';
import { PrepareTransactionRequestReturnTypeWithChainId } from '../types/Actions';

export type ArbAggregatorActions = {
  arbAggregatorReadContract: (
    args: ArbAggregatorReadContractParameters,
  ) => Promise<ArbAggregatorReadContractReturnType>;

  arbAggregatorPrepareTransactionRequest: (
    args: ArbAggregatorPrepareTransactionRequestParameters,
  ) => Promise<PrepareTransactionRequestReturnTypeWithChainId>;
};

export function arbAggregatorActions<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(client: PublicClient<TTransport, TChain>): ArbAggregatorActions {
  return {
    arbAggregatorReadContract: (args) => arbAggregatorReadContract(client, args),
    arbAggregatorPrepareTransactionRequest: (args) =>
      arbAggregatorPrepareTransactionRequest(client, args),
  };
}
