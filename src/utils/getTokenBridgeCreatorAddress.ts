import { Client, Transport, Chain, ChainContract } from 'viem';

import { tokenBridgeCreatorAddress } from '../contracts/TokenBridgeCreator';
import { validateParentChain } from '../types/ParentChain';

export function getTokenBridgeCreatorAddress<TChain extends Chain | undefined>(
  client: Client<Transport, TChain>,
) {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } = validateParentChain(client);

  if (parentChainIsCustom) {
    const contract = client.chain?.contracts?.tokenBridgeCreator as ChainContract | undefined;
    const address = contract?.address;

    if (typeof address === 'undefined') {
      throw new Error(
        `Address for TokenBridgeCreator is missing on custom parent chain with id ${parentChainId}`,
      );
    }

    return address;
  }

  return tokenBridgeCreatorAddress[parentChainId];
}
