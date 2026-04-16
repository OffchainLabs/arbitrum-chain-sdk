import { z, middleware } from 'incur';
import type { PublicClient, WalletClient } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import { findChain, toPublicClient, toAccount, toWalletClient } from './connections';

// ── Env schema (all optional — different commands need different vars) ──

export const envSchema = z.object({
  RPC_URL: z.url().optional(),
  CHAIN_ID: z.string().regex(/^\d+$/).transform(Number).optional(),
  PRIVATE_KEY: z.string().optional(),
  PARENT_CHAIN_RPC_URL: z.url().optional(),
  PARENT_CHAIN_ID: z.string().regex(/^\d+$/).transform(Number).optional(),
  CHILD_CHAIN_RPC_URL: z.url().optional(),
  CHILD_CHAIN_ID: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// ── Vars schema (viem objects populated by middleware) ──

export const varsSchema = z.object({
  publicClient: z.custom<PublicClient>().optional(),
  account: z.custom<PrivateKeyAccount>().optional(),
  parentChainPublicClient: z.custom<PublicClient>().optional(),
  orbitChainPublicClient: z.custom<PublicClient>().optional(),
  parentChainWalletClient: z.custom<WalletClient>().optional(),
  orbitChainWalletClient: z.custom<WalletClient>().optional(),
});

// ── Root middleware: construct clients from whatever env vars are available ──

export const resolveClients = middleware<typeof varsSchema, typeof envSchema>(async (c, next) => {
  if (c.env.RPC_URL && c.env.CHAIN_ID !== undefined) {
    c.set('publicClient', toPublicClient(c.env.RPC_URL, findChain(c.env.CHAIN_ID)));
  }
  if (c.env.PRIVATE_KEY) {
    c.set('account', toAccount(c.env.PRIVATE_KEY));
  }
  if (c.env.PARENT_CHAIN_RPC_URL && c.env.PARENT_CHAIN_ID !== undefined) {
    c.set(
      'parentChainPublicClient',
      toPublicClient(c.env.PARENT_CHAIN_RPC_URL, findChain(c.env.PARENT_CHAIN_ID)),
    );
  }
  if (c.env.CHILD_CHAIN_RPC_URL) {
    c.set('orbitChainPublicClient', toPublicClient(c.env.CHILD_CHAIN_RPC_URL));
  }
  if (c.env.PARENT_CHAIN_RPC_URL && c.env.PARENT_CHAIN_ID !== undefined && c.env.PRIVATE_KEY) {
    c.set(
      'parentChainWalletClient',
      toWalletClient(
        c.env.PARENT_CHAIN_RPC_URL,
        c.env.PRIVATE_KEY,
        findChain(c.env.PARENT_CHAIN_ID),
      ),
    );
  }
  if (c.env.CHILD_CHAIN_RPC_URL && c.env.PRIVATE_KEY) {
    c.set('orbitChainWalletClient', toWalletClient(c.env.CHILD_CHAIN_RPC_URL, c.env.PRIVATE_KEY));
  }
  await next();
});

// ── Per-command validation middleware ──

export const requirePublicClient = middleware<typeof varsSchema, typeof envSchema>((c, next) => {
  if (!c.var.publicClient)
    return c.error({
      code: 'CONFIG',
      message: 'RPC_URL and CHAIN_ID environment variables are required',
    });
  return next();
});

export const requireAccount = middleware<typeof varsSchema, typeof envSchema>((c, next) => {
  if (!c.var.account)
    return c.error({ code: 'CONFIG', message: 'PRIVATE_KEY environment variable is required' });
  return next();
});

export const requireParentChainClient = middleware<typeof varsSchema, typeof envSchema>(
  (c, next) => {
    if (!c.var.parentChainPublicClient)
      return c.error({
        code: 'CONFIG',
        message: 'PARENT_CHAIN_RPC_URL and PARENT_CHAIN_ID environment variables are required',
      });
    return next();
  },
);

export const requireChildChainClient = middleware<typeof varsSchema, typeof envSchema>(
  (c, next) => {
    if (!c.var.orbitChainPublicClient)
      return c.error({
        code: 'CONFIG',
        message: 'CHILD_CHAIN_RPC_URL environment variable is required',
      });
    return next();
  },
);

export const requireCrossChain = middleware<typeof varsSchema, typeof envSchema>((c, next) => {
  if (!c.var.parentChainPublicClient || !c.var.orbitChainPublicClient)
    return c.error({
      code: 'CONFIG',
      message:
        'PARENT_CHAIN_RPC_URL, PARENT_CHAIN_ID, and CHILD_CHAIN_RPC_URL environment variables are required',
    });
  return next();
});

export const requireParentChainWalletClient = middleware<typeof varsSchema, typeof envSchema>(
  (c, next) => {
    if (!c.var.parentChainWalletClient)
      return c.error({
        code: 'CONFIG',
        message:
          'PARENT_CHAIN_RPC_URL, PARENT_CHAIN_ID, and PRIVATE_KEY environment variables are required',
      });
    return next();
  },
);

export const requireChildChainWalletClient = middleware<typeof varsSchema, typeof envSchema>(
  (c, next) => {
    if (!c.var.orbitChainWalletClient)
      return c.error({
        code: 'CONFIG',
        message: 'CHILD_CHAIN_RPC_URL and PRIVATE_KEY environment variables are required',
      });
    return next();
  },
);
