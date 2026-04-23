import { Chain, PublicClient, Transport } from 'viem';
import { arbGasInfoABI, arbGasInfoAddress } from '../contracts/ArbGasInfo';

export type GetGasAccountingParamsParameters = void;

export type GetGasAccountingParamsReturnType = {
  speedLimitPerSecond: bigint;
  gasPoolMax: bigint;
  maxTxGasLimit: bigint;
};

export async function getGasAccountingParams<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetGasAccountingParamsReturnType> {
  // `gasPoolMax` is always zero, as the exponential pricing model has no such notion.
  // see https://github.com/OffchainLabs/nitro-contracts/blob/main/src/precompiles/ArbGasInfo.sol
  const [speedLimitPerSecond, gasPoolMax, maxTxGasLimit] = await client.readContract({
    abi: arbGasInfoABI,
    functionName: 'getGasAccountingParams',
    address: arbGasInfoAddress,
  });
  return {
    speedLimitPerSecond,
    gasPoolMax,
    maxTxGasLimit,
  };
}
