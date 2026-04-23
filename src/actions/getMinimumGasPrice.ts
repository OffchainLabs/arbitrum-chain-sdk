import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbGasInfoABI, arbGasInfoAddress } from '../contracts/ArbGasInfo';

export type GetMinimumGasPriceParameters = void;

export type GetMinimumGasPriceReturnType = ReadContractReturnType<
  typeof arbGasInfoABI,
  'getMinimumGasPrice'
>;

export async function getMinimumGasPrice<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetMinimumGasPriceReturnType> {
  return client.readContract({
    abi: arbGasInfoABI,
    functionName: 'getMinimumGasPrice',
    address: arbGasInfoAddress,
  });
}
