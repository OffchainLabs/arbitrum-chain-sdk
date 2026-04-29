import { Address, isAddress, zeroAddress } from 'viem';

export function isNonZeroAddress(address: Address | undefined): address is Address {
  return typeof address !== 'undefined' && isAddress(address) && address !== zeroAddress;
}
