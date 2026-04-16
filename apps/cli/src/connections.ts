import { z } from 'zod';
import { Chain, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { chains, getCustomParentChains } from '../../../src/chains';
import { sanitizePrivateKey } from '../../../src/utils/sanitizePrivateKey';
import { privateKeySchema } from './primitives';

// ── Resolve helpers ──

export function findChain(chainId: number): Chain {
  const knownChains = [...chains, ...getCustomParentChains()];
  const chain = knownChains.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(
      `Unknown chain ID: ${chainId}. Known: ${knownChains.map((c) => c.id).join(', ')}`,
    );
  }
  return chain;
}

export function toPublicClient<TChain extends Chain | undefined = undefined>(
  rpcUrl: string,
  chain?: TChain,
) {
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

export function toAccount(privateKey: string) {
  return privateKeyToAccount(sanitizePrivateKey(privateKey));
}

export function toWalletClient(rpcUrl: string, privateKey: string, chain?: Chain) {
  return createWalletClient({ account: toAccount(privateKey), chain, transport: http(rpcUrl) });
}

// ── Connection schemas ──

export const chainConnectionSchema = z.object({
  rpcUrl: z.url(),
  chainId: z.number(),
});

export const parentChainConnectionSchema = z.object({
  parentChainRpcUrl: z.url(),
  parentChainId: z.number(),
});

export const childChainConnectionSchema = z.object({
  childChainRpcUrl: z.url(),
});

export const crossChainConnectionSchema = parentChainConnectionSchema.merge(
  childChainConnectionSchema,
);

// ── Composed connection schemas ──

export const chainReadSchema = chainConnectionSchema;
export const chainSignSchema = chainConnectionSchema.extend({ privateKey: privateKeySchema });
export const parentChainReadSchema = parentChainConnectionSchema;
export const parentChainSignSchema = parentChainConnectionSchema.extend({
  privateKey: privateKeySchema,
});
export const childChainSignSchema = childChainConnectionSchema.extend({
  privateKey: privateKeySchema,
});
export const crossChainReadSchema = crossChainConnectionSchema;
export const crossChainSignSchema = crossChainConnectionSchema.extend({
  privateKey: privateKeySchema,
});
export const parentReadChildSignSchema = parentChainConnectionSchema
  .merge(childChainConnectionSchema)
  .extend({ privateKey: privateKeySchema });

// ── Resolvers ──

export function resolveChainRead(input: z.output<typeof chainReadSchema>) {
  return toPublicClient(input.rpcUrl, findChain(input.chainId));
}

export function resolveChainSign(input: z.output<typeof chainSignSchema>) {
  return {
    publicClient: toPublicClient(input.rpcUrl, findChain(input.chainId)),
    account: toAccount(input.privateKey),
  };
}

export function resolveParentChainRead(input: z.output<typeof parentChainReadSchema>) {
  return toPublicClient(input.parentChainRpcUrl, findChain(input.parentChainId));
}

export function resolveParentChainSign(input: z.output<typeof parentChainSignSchema>) {
  return {
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    account: toAccount(input.privateKey),
  };
}

export function resolveChildChainSign(input: z.output<typeof childChainSignSchema>) {
  return {
    childChainWalletClient: toWalletClient(input.childChainRpcUrl, input.privateKey),
  };
}

export function resolveCrossChainRead(input: z.output<typeof crossChainReadSchema>) {
  return {
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainPublicClient: toPublicClient(input.childChainRpcUrl),
  };
}

export function resolveCrossChainSign(input: z.output<typeof crossChainSignSchema>) {
  return {
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainPublicClient: toPublicClient(input.childChainRpcUrl),
    account: toAccount(input.privateKey),
  };
}

export function resolveParentReadChildSign(input: z.output<typeof parentReadChildSignSchema>) {
  return {
    parentChainPublicClient: toPublicClient(
      input.parentChainRpcUrl,
      findChain(input.parentChainId),
    ),
    orbitChainWalletClient: toWalletClient(input.childChainRpcUrl, input.privateKey),
  };
}
