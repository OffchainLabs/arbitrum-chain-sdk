import {
  Abi,
  Address,
  Chain,
  encodeFunctionData as viemEncodeFunctionData,
  EncodeFunctionDataParameters as ViemEncodeFunctionDataParameters,
  Hex,
  PublicClient,
  Transport,
} from 'viem';
import {
  upgradeExecutorEncodeFunctionData,
  UpgradeExecutorFunctionName,
} from './upgradeExecutorEncodeFunctionData';
import { GetFunctionName } from './types/utils';

type ContractFunctionName<TAbi extends Abi> = GetFunctionName<TAbi>;

export type ContractEncodeFunctionDataParameters<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
> = ViemEncodeFunctionDataParameters<TAbi, TFunctionName>;

type PrepareContractCallParameters<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
> = Omit<ContractEncodeFunctionDataParameters<TAbi, TFunctionName>, 'abi'> & {
  abi: TAbi;
  to: Address;
  upgradeExecutor: Address | false;
  value?: bigint;
  upgradeExecutorFunctionName?: Extract<UpgradeExecutorFunctionName, 'execute' | 'executeCall'>;
};

type PreparedContractCallParameters = {
  to: Address;
  data: Hex;
  value: bigint;
};

function encodeContractFunctionData<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
>({ abi, functionName, args }: PrepareContractCallParameters<TAbi, TFunctionName>) {
  return viemEncodeFunctionData({
    abi,
    functionName,
    args,
  } as unknown as ViemEncodeFunctionDataParameters<TAbi, TFunctionName>);
}

export function prepareContractCallParameters<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
>(params: PrepareContractCallParameters<TAbi, TFunctionName>): PreparedContractCallParameters {
  const { upgradeExecutor, value = BigInt(0) } = params;
  const data = encodeContractFunctionData(params);

  if (!upgradeExecutor) {
    return {
      to: params.to,
      data,
      value,
    };
  }

  return {
    to: upgradeExecutor,
    data: upgradeExecutorEncodeFunctionData({
      functionName: params.upgradeExecutorFunctionName ?? 'executeCall',
      args: [
        params.to, // target
        data, // targetCallData
      ],
    }),
    value,
  };
}

type PrepareContractTransactionRequestParameters<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
> = PrepareContractCallParameters<TAbi, TFunctionName> & {
  account: Address;
  chainId: number;
  gas?: bigint;
};

export async function prepareContractTransactionRequest<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi>,
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
>(
  client: PublicClient<TTransport, TChain>,
  params: PrepareContractTransactionRequestParameters<TAbi, TFunctionName>,
) {
  const { account, chainId, gas } = params;
  const { to, data, value } = prepareContractCallParameters<TAbi, TFunctionName>(params);

  // @ts-expect-error -- todo: fix viem type issue
  const request = await client.prepareTransactionRequest({
    chain: client.chain,
    to,
    data,
    value,
    account,
    gas,
  });

  return { ...request, gas: request.gas, chainId };
}
