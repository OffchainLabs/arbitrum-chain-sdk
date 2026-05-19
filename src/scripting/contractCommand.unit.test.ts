import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z, type ZodType } from 'zod';
import { keccak256, toBytes } from 'viem';

import { buildContractCommandSchema } from './contractCommandSchema';
import { contractRegistry } from './contractRegistry';
import { runContractCommand } from './runContractCommand';

import { arbAggregatorABI } from '../contracts/ArbAggregator';
import { schemas as arbAggregatorSchemas } from '../contracts/ArbAggregator.schemas';
import { inboxABI as inboxV32ABI } from '../contracts/Inbox/v3.2';
import { schemas as inboxV32Schemas } from '../contracts/Inbox/v3.2.schemas';

const RPC = 'https://example.test/rpc';
const CHAIN_ID = 421614;
const ADDR = '0x' + '1'.repeat(40);
const ACCOUNT = '0x' + '2'.repeat(40);
const UPGRADE_EXECUTOR = '0x' + '3'.repeat(40);

const __viemMocks = vi.hoisted(() => {
  const readContract = vi.fn().mockResolvedValue(['0xabc']);
  const prepareTransactionRequest = vi
    .fn()
    .mockResolvedValue({ to: '0xto', data: '0xdata', value: 0n });
  const mockClient = {
    chain: { id: 421614 },
    readContract,
    prepareTransactionRequest,
  };
  return { readContract, prepareTransactionRequest, mockClient };
});

vi.mock('./viemTransforms', () => ({
  toPublicClient: () => __viemMocks.mockClient,
  findChain: (id: number) => ({ id }),
}));

beforeEach(() => {
  __viemMocks.readContract.mockClear();
  __viemMocks.prepareTransactionRequest.mockClear();
});

describe('buildContractCommandSchema', () => {
  const schema = buildContractCommandSchema(
    arbAggregatorABI,
    arbAggregatorSchemas as Record<string, ZodType>,
  );

  it('parses a read variant (no account required)', () => {
    const parsed = schema.parse({
      function: 'getBatchPosters()',
      address: ADDR,
      rpcUrl: RPC,
      chainId: CHAIN_ID,
      args: [],
    });
    expect(Array.isArray(parsed)).toBe(true);
    const inner = (parsed as readonly [unknown])[0] as { function: string };
    expect(inner.function).toBe('getBatchPosters()');
  });

  it('requires account on a write variant', () => {
    expect(() =>
      schema.parse({
        function: 'addBatchPoster(address)',
        address: ADDR,
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        args: [ADDR],
      }),
    ).toThrow();
  });

  it('parses a write variant with account + optional upgradeExecutor', () => {
    const parsed = schema.parse({
      function: 'addBatchPoster(address)',
      address: ADDR,
      rpcUrl: RPC,
      chainId: CHAIN_ID,
      args: [ADDR],
      account: ACCOUNT,
      upgradeExecutor: UPGRADE_EXECUTOR,
    });
    const inner = (parsed as readonly [unknown])[0] as {
      function: string;
      account: string;
      upgradeExecutor?: string;
    };
    expect(inner.function).toBe('addBatchPoster(address)');
    expect(inner.account).toBe(ACCOUNT);
    expect(inner.upgradeExecutor).toBe(UPGRADE_EXECUTOR);
  });

  it('rejects the bare name (full signature required)', () => {
    expect(() =>
      schema.parse({
        function: 'getBatchPosters',
        address: ADDR,
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        args: [],
      }),
    ).toThrow();
  });

  it('rejects an unknown function signature', () => {
    expect(() =>
      schema.parse({
        function: 'thisDoesNotExist()',
        address: ADDR,
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        args: [],
      }),
    ).toThrow();
  });
});

describe('overload disambiguation (Inbox.depositEth)', () => {
  const schema = buildContractCommandSchema(
    inboxV32ABI,
    inboxV32Schemas as Record<string, ZodType>,
  );

  it('discriminates overloads by canonical signature', () => {
    const noArg = schema.parse({
      function: 'depositEth()',
      address: ADDR,
      rpcUrl: RPC,
      chainId: CHAIN_ID,
      args: [],
      account: ACCOUNT,
      value: '1000',
    });
    expect((noArg as readonly [{ function: string }])[0].function).toBe('depositEth()');
  });

  it('rejects the bare overloaded name', () => {
    expect(() =>
      schema.parse({
        function: 'depositEth',
        address: ADDR,
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        args: [],
        account: ACCOUNT,
      }),
    ).toThrow();
  });
});

describe('registry-wide assembly', () => {
  it('every contract in the registry builds a non-empty schema', () => {
    expect(contractRegistry.length).toBeGreaterThan(0);
    for (const entry of contractRegistry) {
      const schema = buildContractCommandSchema(
        entry.abi,
        entry.schemas as Record<string, ZodType>,
      );
      expect(() => schema.parse({})).toThrow();
    }
  });

  it('emits a JSON Schema oneOf catalog for a contract', () => {
    const schema = buildContractCommandSchema(
      arbAggregatorABI,
      arbAggregatorSchemas as Record<string, ZodType>,
    );
    const json = z.toJSONSchema(schema, {
      io: 'input',
      unrepresentable: 'any',
    }) as { allOf?: unknown[]; anyOf?: unknown[]; oneOf?: unknown[] };
    // The .transform()-wrapped union JSON-encodes as a piped/all-of shape.
    // Drill in to find the union variants regardless of where they ended up.
    const collect = (n: unknown): unknown[] => {
      if (!n || typeof n !== 'object') return [];
      const node = n as Record<string, unknown[]>;
      if (Array.isArray(node.anyOf) && node.anyOf.length > 1) return node.anyOf;
      if (Array.isArray(node.oneOf) && node.oneOf.length > 1) return node.oneOf;
      if (Array.isArray(node.allOf)) {
        for (const child of node.allOf) {
          const r = collect(child);
          if (r.length > 0) return r;
        }
      }
      return [];
    };
    const variants = collect(json);
    expect(variants.length).toBeGreaterThan(1);
  });
});

describe('latest-alias entries', () => {
  it('Rollup shares abi+schemas with Rollup@v3.2', () => {
    const latest = contractRegistry.find((e) => e.name === 'Rollup@v3.2');
    const alias = contractRegistry.find((e) => e.name === 'Rollup');
    expect(latest).toBeDefined();
    expect(alias).toBeDefined();
    expect(alias!.abi).toBe(latest!.abi);
    expect(alias!.schemas).toBe(latest!.schemas);
  });

  it.each([
    ['Inbox', 'Inbox@v3.2'],
    ['Rollup', 'Rollup@v3.2'],
    ['RollupCreator', 'RollupCreator@v3.2'],
    ['SequencerInbox', 'SequencerInbox@v3.2'],
    ['TokenBridgeCreator', 'TokenBridgeCreator@v1.2'],
  ])('%s aliases %s', (alias, target) => {
    const a = contractRegistry.find((e) => e.name === alias);
    const t = contractRegistry.find((e) => e.name === target);
    expect(a).toBeDefined();
    expect(t).toBeDefined();
    expect(a!.abi).toBe(t!.abi);
    expect(a!.schemas).toBe(t!.schemas);
  });
});

describe('runContractCommand dispatch', () => {
  it('routes view functions through readContract', async () => {
    await runContractCommand({
      abi: arbAggregatorABI,
      parsed: {
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        address: ADDR as `0x${string}`,
        function: 'getBatchPosters',
        args: [],
      },
    });
    expect(__viemMocks.readContract).toHaveBeenCalledTimes(1);
    const call = __viemMocks.readContract.mock.calls[0][0];
    expect(call.functionName).toBe('getBatchPosters');
    expect(call.address).toBe(ADDR);
  });

  it('routes nonpayable functions through prepareTransactionRequest', async () => {
    await runContractCommand({
      abi: arbAggregatorABI,
      parsed: {
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        address: ADDR as `0x${string}`,
        function: 'addBatchPoster',
        args: [ADDR],
        account: ACCOUNT as `0x${string}`,
      },
    });
    expect(__viemMocks.prepareTransactionRequest).toHaveBeenCalledTimes(1);
    const call = __viemMocks.prepareTransactionRequest.mock.calls[0][0];
    expect(call.account).toBe(ACCOUNT);
    expect(call.to).toBe(ADDR);
    expect(call.data).toMatch(/^0x/);
  });

  it('wraps writes through upgradeExecutor when provided', async () => {
    await runContractCommand({
      abi: arbAggregatorABI,
      parsed: {
        rpcUrl: RPC,
        chainId: CHAIN_ID,
        address: ADDR as `0x${string}`,
        function: 'addBatchPoster',
        args: [ADDR],
        account: ACCOUNT as `0x${string}`,
        upgradeExecutor: UPGRADE_EXECUTOR as `0x${string}`,
      },
    });
    const call = __viemMocks.prepareTransactionRequest.mock.calls[0][0];
    expect(call.to).toBe(UPGRADE_EXECUTOR);
    // Compute the selector rather than hard-coding so it survives ABI churn.
    const executeCallSelector = keccak256(toBytes('executeCall(address,bytes)')).slice(0, 10);
    expect(call.data.toLowerCase().startsWith(executeCallSelector.toLowerCase())).toBe(true);
  });
});
