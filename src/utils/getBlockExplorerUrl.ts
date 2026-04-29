import { Chain } from 'viem';

export function getBlockExplorerUrl(chain: Chain | undefined) {
  return chain?.blockExplorers?.default.url;
}
