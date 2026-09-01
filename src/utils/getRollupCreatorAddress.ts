import { Client, Transport, Chain, ChainContract, Address } from 'viem';

import { rollupCreatorAddress as rollupCreatorV3Dot2Address } from '../contracts/RollupCreator/v3.2';
import { rollupCreatorAddress as rollupCreatorV2Dot1Address } from '../contracts/RollupCreator/v2.1';

import { ParentChainId, validateParentChain } from '../types/ParentChain';
import { RollupCreatorSupportedVersion } from '../types/createRollupTypes';

export function getRollupCreatorAddress<TChain extends Chain | undefined>(
  client: Client<Transport, TChain>,
  rollupCreatorVersion: RollupCreatorSupportedVersion = 'v3.2',
): Address {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } = validateParentChain(client);

  if (parentChainIsCustom) {
    const contract = client.chain?.contracts?.rollupCreator as ChainContract | undefined;
    const address = contract?.address;

    if (typeof address === 'undefined') {
      throw new Error(
        `Address for RollupCreator is missing on custom parent chain with id ${parentChainId}`,
      );
    }

    return address;
  }

  // TODO: consider batching this change with deprecating v2.1 rollup creator in the sdk
  // older versions are not deployed on all parent chains, so their maps may miss entries
  const rollupCreatorAddress: Partial<Record<ParentChainId, Address>> =
    rollupCreatorVersion === 'v3.2'
      ? //
        rollupCreatorV3Dot2Address
      : //
        rollupCreatorV2Dot1Address;

  const address = rollupCreatorAddress[parentChainId];

  if (typeof address === 'undefined') {
    throw new Error(
      `RollupCreator ${rollupCreatorVersion} is not deployed on parent chain ${parentChainId}`,
    );
  }

  return address;
}
