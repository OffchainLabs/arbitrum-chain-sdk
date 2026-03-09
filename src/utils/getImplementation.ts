import { Chain, Transport, PublicClient, Address, zeroAddress } from 'viem';

export async function getImplementation<TChain extends Chain | undefined>({
  client,
  address,
  secondary,
}: {
  client: PublicClient<Transport, TChain>;
  address: Address;
  secondary?: boolean;
}): Promise<Address> {
  const value = await client.getStorageAt({
    address,
    // https://eips.ethereum.org/EIPS/eip-1967#logic-contract-address
    slot: secondary
      ? '0x2b1dbce74324248c222f0ec2d5ed7bd323cfc425b336f0253c5ccfda7265546d'
      : '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
  });

  if (typeof value === 'undefined') {
    return zeroAddress;
  }

  // strip zeros
  return `0x${value.slice(26)}`;
}
