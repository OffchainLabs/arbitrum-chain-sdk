import * as chains from './chains';

export function chainIsArbitrum(chainId: bigint): boolean {
  switch (chainId) {
    case BigInt(chains.arbitrumOne.id):
    case BigInt(chains.arbitrumNova.id):
    case BigInt(chains.arbitrumSepolia.id):
    case BigInt(chains.nitroTestnodeL2.id):
    case BigInt(chains.nitroTestnodeL3.id):
      return true;

    default:
      return false;
  }
}
