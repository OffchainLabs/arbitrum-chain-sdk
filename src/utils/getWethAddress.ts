import { Client, Transport, Chain, ChainContract, Address } from 'viem';

import { wethAddress } from '../contracts/WETH';
import { validateParentChain } from '../types/ParentChain';

export function getWethAddress<TChain extends Chain | undefined>(
  client: Client<Transport, TChain>,
): Address {
  const { chainId: parentChainId, isCustom: parentChainIsCustom } = validateParentChain(client);

  if (parentChainIsCustom) {
    const contract = client.chain?.contracts?.weth as ChainContract | undefined;
    const address = contract?.address;

    if (typeof address === 'undefined') {
      throw new Error(
        `Address for WETH is missing on custom parent chain with id ${parentChainId}`,
      );
    }

    return address;
  }

  return wethAddress[parentChainId];
}
