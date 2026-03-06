import { Address, Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { upgradeExecutorABI } from '../contracts/UpgradeExecutor';
import { UpgradeExecutorRole } from '../upgradeExecutorEncodeFunctionData';
import { ActionParameters } from '../types/Actions';

export type HasRoleParameters<Curried extends boolean = false> = ActionParameters<
  {
    role: UpgradeExecutorRole;
    address: Address;
  },
  'upgradeExecutor',
  Curried
>;

export type HasRoleReturnType = ReadContractReturnType<typeof upgradeExecutorABI, 'hasRole'>;

export async function hasRole<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
  { upgradeExecutor, params }: HasRoleParameters,
): Promise<HasRoleReturnType> {
  return client.readContract({
    abi: upgradeExecutorABI,
    functionName: 'hasRole',
    address: upgradeExecutor,
    args: [params.role, params.address],
  });
}
