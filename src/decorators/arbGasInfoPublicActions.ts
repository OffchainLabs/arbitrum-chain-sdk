import { Transport, Chain, PublicClient } from 'viem';

import { arbGasInfoABI, arbGasInfoAddress } from '../contracts/ArbGasInfo';
import {
  createContractRead,
  ContractReadFunctionName,
  ContractReadParameters,
  ContractReadReturnType,
} from '../contractRead';

type ArbGasInfoFunctionName = ContractReadFunctionName<typeof arbGasInfoABI>;
type ArbGasInfoReadContractParameters<TFunctionName extends ArbGasInfoFunctionName> =
  ContractReadParameters<typeof arbGasInfoABI, TFunctionName>;
type ArbGasInfoReadContractReturnType<TFunctionName extends ArbGasInfoFunctionName> =
  ContractReadReturnType<typeof arbGasInfoABI, TFunctionName>;

const arbGasInfoReadContract = createContractRead<typeof arbGasInfoABI>(
  arbGasInfoABI,
  () => arbGasInfoAddress,
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- todo: remove generic if not breaking
export type ArbGasInfoPublicActions<TChain extends Chain | undefined = Chain | undefined> = {
  arbGasInfoReadContract: <TFunctionName extends ArbGasInfoFunctionName>(
    args: ArbGasInfoReadContractParameters<TFunctionName>,
  ) => Promise<ArbGasInfoReadContractReturnType<TFunctionName>>;
};

export function arbGasInfoPublicActions<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(client: PublicClient<TTransport, TChain>): ArbGasInfoPublicActions<TChain> {
  return {
    arbGasInfoReadContract: (args) => arbGasInfoReadContract(client, args),
  };
}
