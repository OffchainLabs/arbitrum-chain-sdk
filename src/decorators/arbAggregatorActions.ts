import { Transport, Chain, PrepareTransactionRequestReturnType, PublicClient } from 'viem';

import { arbAggregatorABI, arbAggregatorAddress } from '../contracts/ArbAggregator';
import {
  createContractRead,
  ContractReadFunctionName,
  ContractReadParameters,
  ContractReadReturnType,
} from '../contractRead';
import {
  arbAggregatorPrepareTransactionRequest,
  ArbAggregatorPrepareTransactionRequestFunctionName,
  ArbAggregatorPrepareTransactionRequestParameters,
} from '../arbAggregatorPrepareTransactionRequest';

type ArbAggregatorFunctionName = ContractReadFunctionName<typeof arbAggregatorABI>;
type ArbAggregatorReadContractParameters<TFunctionName extends ArbAggregatorFunctionName> =
  ContractReadParameters<typeof arbAggregatorABI, TFunctionName>;
type ArbAggregatorReadContractReturnType<TFunctionName extends ArbAggregatorFunctionName> =
  ContractReadReturnType<typeof arbAggregatorABI, TFunctionName>;

const arbAggregatorReadContract = createContractRead<typeof arbAggregatorABI>(
  arbAggregatorABI,
  () => arbAggregatorAddress,
);

export type ArbAggregatorActions<TChain extends Chain | undefined = Chain | undefined> = {
  arbAggregatorReadContract: <TFunctionName extends ArbAggregatorFunctionName>(
    args: ArbAggregatorReadContractParameters<TFunctionName>,
  ) => Promise<ArbAggregatorReadContractReturnType<TFunctionName>>;

  arbAggregatorPrepareTransactionRequest: <
    TFunctionName extends ArbAggregatorPrepareTransactionRequestFunctionName,
  >(
    args: ArbAggregatorPrepareTransactionRequestParameters<TFunctionName>,
  ) => Promise<PrepareTransactionRequestReturnType<TChain> & { chainId: number }>;
};

export function arbAggregatorActions<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(client: PublicClient<TTransport, TChain>): ArbAggregatorActions<TChain> {
  return {
    arbAggregatorReadContract: (args) => arbAggregatorReadContract(client, args),

    arbAggregatorPrepareTransactionRequest: (args) =>
      arbAggregatorPrepareTransactionRequest(client, args),
  };
}
