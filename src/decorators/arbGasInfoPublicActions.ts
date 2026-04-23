import { Transport, Chain, PublicClient } from 'viem';

import {
  arbGasInfoReadContract,
  ArbGasInfoReadContractParameters,
  ArbGasInfoReadContractReturnType,
} from '../arbGasInfoReadContract';

export type ArbGasInfoPublicActions = {
  arbGasInfoReadContract: (
    args: ArbGasInfoReadContractParameters,
  ) => Promise<ArbGasInfoReadContractReturnType>;
};

export function arbGasInfoPublicActions<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(client: PublicClient<TTransport, TChain>): ArbGasInfoPublicActions {
  return {
    arbGasInfoReadContract: (args) => arbGasInfoReadContract(client, args),
  };
}
