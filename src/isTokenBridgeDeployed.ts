import { Address, Chain, PublicClient, Transport } from 'viem';

import { tokenBridgeCreatorABI } from './contracts/TokenBridgeCreator';
import { getTokenBridgeCreatorAddress } from './utils';
import { rollupABI } from './contracts/Rollup';
import { WithTokenBridgeCreatorAddressOverride } from './types/createTokenBridgeTypes';

/**
 * Checks whether the token bridge contracts were deployed for a given Rollup.
 *
 * @param {String} params.parentChainPublicClient - The parent chain viem PublicClient.
 * @param {String} params.orbitChainPublicClient - The orbit chain viem PublicClient.
 * @param {String} params.rollup - The address of the Rollup on the parent chain.
 * @param {String} params.tokenBridgeCreatorAddress - Specifies a custom address for the TokenBridgeCreator. By default, the address will be automatically detected based on the provided chain.
 *
 * @returns true if token bridge was already deployed
 */
export async function isTokenBridgeDeployed<
  TParentChain extends Chain | undefined,
  TOrbitChain extends Chain | undefined,
>({
  parentChainPublicClient,
  orbitChainPublicClient,
  rollup,
  tokenBridgeCreatorAddressOverride,
}: WithTokenBridgeCreatorAddressOverride<{
  parentChainPublicClient: PublicClient<Transport, TParentChain>;
  orbitChainPublicClient: PublicClient<Transport, TOrbitChain>;
  rollup: Address;
}>): Promise<boolean> {
  const inbox = await parentChainPublicClient.readContract({
    address: rollup,
    abi: rollupABI,
    functionName: 'inbox',
  });

  const [router] = await parentChainPublicClient.readContract({
    address:
      tokenBridgeCreatorAddressOverride ?? getTokenBridgeCreatorAddress(parentChainPublicClient),
    abi: tokenBridgeCreatorABI,
    functionName: 'inboxToL2Deployment',
    args: [inbox],
  });

  if (router) {
    const code = await orbitChainPublicClient.getBytecode({ address: router });

    if (code) {
      return true;
    }
  }

  return false;
}
