import { PublicClient, Transport, Chain, parseAbi } from 'viem';

/**
 * Returns the the ArbOS version from the provider passed in parameter.
 *
 * @param arbitrumPublicClient - viem public client
 * @throws if the provider is not an arbitrum chain
 * @returns the ArbOS version
 */
export async function getArbOSVersion<TChain extends Chain | undefined>(
  arbitrumPublicClient: PublicClient<Transport, TChain>,
): Promise<number> {
  const arbOSVersion = await arbitrumPublicClient.readContract({
    address: '0x0000000000000000000000000000000000000064',
    abi: parseAbi(['function arbOSVersion() view returns (uint256)']),
    functionName: 'arbOSVersion',
  });
  //
  /**
   * Version of the ArbOS is starting at 55
   * {@see https://github.com/OffchainLabs/nitro/blob/a20a1c70cc11ac52c7cfe6a20f00c880c2009a8f/precompiles/ArbSys.go#L62-L66}
   */
  return Number(arbOSVersion) - 55;
}
