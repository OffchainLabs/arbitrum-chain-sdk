import { Chain, PublicClient, ReadContractReturnType, Transport } from 'viem';
import { arbOwnerPublicABI, arbOwnerPublicAddress } from '../contracts/ArbOwnerPublic';

export type GetScheduledUpgradeParameters = void;

type GetScheduledUpgradeRawReturnType = ReadContractReturnType<
  typeof arbOwnerPublicABI,
  'getScheduledUpgrade'
>;
export type GetScheduledUpgradeReturnType = {
  arbosVersion: GetScheduledUpgradeRawReturnType[0];
  scheduledForTimestamp: GetScheduledUpgradeRawReturnType[1];
};

export async function getScheduledUpgrade<TChain extends Chain>(
  client: PublicClient<Transport, TChain>,
): Promise<GetScheduledUpgradeReturnType> {
  const [arbosVersion, scheduledForTimestamp] = await client.readContract({
    abi: arbOwnerPublicABI,
    functionName: 'getScheduledUpgrade',
    address: arbOwnerPublicAddress,
  });
  return {
    arbosVersion,
    scheduledForTimestamp,
  };
}
