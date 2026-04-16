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

// -- Resolver types --
// Each resolver strips connection fields from the input and replaces them
// with resolved viem objects. The typed tuple return lets callers pass the
// result directly to schema.transform() for use with cmd().

type WithPublicClient<T> = [
  Omit<T, 'rpcUrl' | 'chainId'> & { publicClient: ReturnType<typeof toPublicClient<Chain>> },
];

type WithParentChainPublicClient<T> = [
  Omit<T, 'parentChainRpcUrl' | 'parentChainId'> & {
    parentChainPublicClient: ReturnType<typeof toPublicClient<Chain>>;
  },
];

type WithChainSign<T> = [
  Omit<T, 'rpcUrl' | 'chainId' | 'privateKey'> & {
    publicClient: ReturnType<typeof toPublicClient<Chain>>;
    account: ReturnType<typeof toAccount>;
  },
];

type WithParentChainSign<T> = [
  Omit<T, 'parentChainRpcUrl' | 'parentChainId' | 'privateKey'> & {
    parentChainPublicClient: ReturnType<typeof toPublicClient<Chain>>;
    account: ReturnType<typeof toAccount>;
  },
];

type WithChildChainSign<T> = [
  Omit<T, 'orbitChainRpcUrl' | 'orbitChainId' | 'privateKey'> & {
    orbitChainWalletClient: ReturnType<typeof toWalletClient<Chain>>;
  },
];

type WithParentReadChildSign<T> = [
  Omit<T, 'parentChainRpcUrl' | 'parentChainId' | 'orbitChainRpcUrl' | 'privateKey'> & {
    parentChainPublicClient: ReturnType<typeof toPublicClient<Chain>>;
    orbitChainWalletClient: ReturnType<typeof toWalletClient>;
  },
];

// -- Resolvers --

export function withPublicClient<T extends { rpcUrl: string; chainId: number }>(
  input: T,
): WithPublicClient<T> {
  const { rpcUrl, chainId, ...rest } = input;
  return [{ publicClient: toPublicClient(rpcUrl, findChain(chainId)), ...rest }] as WithPublicClient<T>;
}

export function withParentChainPublicClient<
  T extends { parentChainRpcUrl: string; parentChainId: number },
>(input: T): WithParentChainPublicClient<T> {
  const { parentChainRpcUrl, parentChainId, ...rest } = input;
  return [
    { parentChainPublicClient: toPublicClient(parentChainRpcUrl, findChain(parentChainId)), ...rest },
  ] as WithParentChainPublicClient<T>;
}

export function withChainSign<
  T extends { rpcUrl: string; chainId: number; privateKey: string },
>(input: T): WithChainSign<T> {
  const { rpcUrl, chainId, privateKey, ...rest } = input;
  return [
    { publicClient: toPublicClient(rpcUrl, findChain(chainId)), account: toAccount(privateKey), ...rest },
  ] as WithChainSign<T>;
}

export function withParentChainSign<
  T extends { parentChainRpcUrl: string; parentChainId: number; privateKey: string },
>(input: T): WithParentChainSign<T> {
  const { parentChainRpcUrl, parentChainId, privateKey, ...rest } = input;
  return [
    {
      parentChainPublicClient: toPublicClient(parentChainRpcUrl, findChain(parentChainId)),
      account: toAccount(privateKey),
      ...rest,
    },
  ] as WithParentChainSign<T>;
}

export function withChildChainSign<
  T extends { orbitChainRpcUrl: string; orbitChainId: number; privateKey: string },
>(input: T): WithChildChainSign<T> {
  const { orbitChainRpcUrl, orbitChainId, privateKey, ...rest } = input;
  return [
    { orbitChainWalletClient: toWalletClient(orbitChainRpcUrl, privateKey, findChain(orbitChainId)), ...rest },
  ] as WithChildChainSign<T>;
}

export function withParentReadChildSign<
  T extends {
    parentChainRpcUrl: string;
    parentChainId: number;
    orbitChainRpcUrl: string;
    privateKey: string;
  },
>(input: T): WithParentReadChildSign<T> {
  const { parentChainRpcUrl, parentChainId, orbitChainRpcUrl, privateKey, ...rest } = input;
  return [
    {
      parentChainPublicClient: toPublicClient(parentChainRpcUrl, findChain(parentChainId)),
      orbitChainWalletClient: toWalletClient(orbitChainRpcUrl, privateKey),
      ...rest,
    },
  ] as WithParentReadChildSign<T>;
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
