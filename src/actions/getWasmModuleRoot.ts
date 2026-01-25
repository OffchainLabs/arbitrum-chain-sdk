import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { rollupABI } from '../contracts/Rollup';
import { WithContractAddress } from '../types/Actions';
import { getRollupAddress } from '../getRollupAddress';

export type GetWasmModuleRootParameters<Curried extends boolean = false> = WithContractAddress<
  {},
  'rollupAdminLogic',
  Curried
>;

export type GetWasmModuleRootReturnType = ReadContractReturnType<
  typeof rollupABI,
  'wasmModuleRoot'
>;

export async function getWasmModuleRoot<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  args: GetWasmModuleRootParameters,
): Promise<GetWasmModuleRootReturnType> {
  const rollupAdminLogicAddress =
    'sequencerInbox' in args ? await getRollupAddress(client, args) : args.rollupAdminLogic;
  return client.readContract({
    abi: rollupABI,
    functionName: 'wasmModuleRoot',
    address: rollupAdminLogicAddress,
  });
}
