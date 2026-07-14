import type {
  Abi,
  AbiParametersToPrimitiveTypes,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import type {
  Address,
  Chain,
  PublicClient,
  ReadContractParameters,
  ReadContractReturnType,
  Transport,
} from 'viem';

export type ContractReadFunctionName<TAbi extends Abi> = ExtractAbiFunctionNames<
  TAbi,
  'pure' | 'view'
>;

type ContractReadArgs<
  TAbi extends Abi,
  TFunctionName extends ContractReadFunctionName<TAbi>,
> = AbiParametersToPrimitiveTypes<ExtractAbiFunction<TAbi, TFunctionName>['inputs']>;

export type ContractReadParameters<
  TAbi extends Abi,
  TFunctionName extends ContractReadFunctionName<TAbi>,
  TAddressParameters extends object = Record<never, never>,
> = TAddressParameters & { functionName: TFunctionName } & (ContractReadArgs<
    TAbi,
    TFunctionName
  > extends readonly []
    ? { args?: never }
    : { args: ContractReadArgs<TAbi, TFunctionName> });

export type ContractReadReturnType<
  TAbi extends Abi,
  TFunctionName extends ContractReadFunctionName<TAbi>,
> = ReadContractReturnType<TAbi, TFunctionName>;

export function createContractRead<
  const TAbi extends Abi,
  TAddressParameters extends object = Record<never, never>,
>(abi: TAbi, getAddress: (parameters: TAddressParameters) => Address) {
  return function contractRead<
    TTransport extends Transport,
    TChain extends Chain | undefined,
    TFunctionName extends ContractReadFunctionName<TAbi>,
  >(
    client: PublicClient<TTransport, TChain>,
    parameters: ContractReadParameters<TAbi, TFunctionName, TAddressParameters>,
  ): Promise<ContractReadReturnType<TAbi, TFunctionName>> {
    return client.readContract(
      {
        abi,
        address: getAddress(parameters),
        functionName: parameters.functionName,
        args: parameters.args,
      } as unknown as ReadContractParameters<TAbi, TFunctionName>,
    );
  };
}
