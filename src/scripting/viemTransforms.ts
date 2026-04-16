import { Chain, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sanitizePrivateKey } from '../utils/sanitizePrivateKey';
import { chains, getCustomParentChains } from '../chains';

export function findChain(chainId: number): Chain {
  const knownChains = [...chains, ...getCustomParentChains()];
  const chain = knownChains.find((c) => c.id === chainId);
  if (!chain) {
    const known = knownChains.map((c) => c.id).join(', ');
    throw new Error(`Unknown chain ID: ${chainId}. Known chain IDs: ${known}`);
  }
  return chain;
}

export function toPublicClient<TChain extends Chain | undefined = undefined>(
  rpcUrl: string,
  chain?: TChain,
) {
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

type WithPublicClient<T> = [Omit<T, 'rpcUrl' | 'chainId'> & {
  publicClient: ReturnType<typeof toPublicClient<Chain>>;
}];

export function withPublicClient<T extends { rpcUrl: string; chainId: number }>(
  input: T,
): WithPublicClient<T> {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }] as WithPublicClient<T>;
}

export function toAccount(privateKey: string) {
  return privateKeyToAccount(sanitizePrivateKey(privateKey));
}

export function toWalletClient<TChain extends Chain | undefined = undefined>(
  rpcUrl: string,
  privateKey: string,
  chain?: TChain,
) {
  const account = privateKeyToAccount(sanitizePrivateKey(privateKey));
  return createWalletClient({ account, chain, transport: http(rpcUrl) });
}
