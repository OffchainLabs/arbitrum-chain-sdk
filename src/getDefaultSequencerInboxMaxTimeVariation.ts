import { Client, Transport, Chain } from 'viem';

import { ParentChainId, validateParentChain } from './types/ParentChain';
import { getParentChainBlockTime } from './getParentChainBlockTime';

export type SequencerInboxMaxTimeVariation = {
  delayBlocks: bigint;
  futureBlocks: bigint;
  delaySeconds: bigint;
  futureSeconds: bigint;
};

export function getDefaultSequencerInboxMaxTimeVariation<TChain extends Chain | undefined>(
  parentChainIdOrClient: ParentChainId | Client<Transport, TChain>,
): SequencerInboxMaxTimeVariation {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } =
    validateParentChain(parentChainIdOrClient);

  if (parentChainIsCustom) {
    throw new Error(
      `[getDefaultSequencerInboxMaxTimeVariation] can't provide defaults for custom parent chain with id ${parentChainId}`,
    );
  }

  const delaySeconds = 60 * 60 * 24 * 4; // 4 days;
  const futureSeconds = 60 * 60; // 1 hour;

  const blockTime = getParentChainBlockTime(parentChainId);

  return {
    delayBlocks: BigInt(delaySeconds / blockTime),
    futureBlocks: BigInt(futureSeconds / blockTime),
    delaySeconds: BigInt(delaySeconds),
    futureSeconds: BigInt(futureSeconds),
  };
}
