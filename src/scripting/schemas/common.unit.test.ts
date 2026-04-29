import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  hexSchema,
  bigintSchema,
  privateKeySchema,
  chainConfigInputSchema,
} from './common';

describe('addressSchema', () => {
  it('accepts a valid 42-char hex address', () => {
    const result = addressSchema.safeParse('0x0000000000000000000000000000000000000001');
    expect(result.success).toBe(true);
  });

  it('rejects too-short address (39 hex chars)', () => {
    const result = addressSchema.safeParse('0x' + '0'.repeat(39));
    expect(result.success).toBe(false);
  });

  it('rejects too-long address (41 hex chars)', () => {
    const result = addressSchema.safeParse('0x' + '0'.repeat(41));
    expect(result.success).toBe(false);
  });

  it('rejects missing 0x prefix', () => {
    const result = addressSchema.safeParse('0'.repeat(40));
    expect(result.success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const result = addressSchema.safeParse('0x' + 'g'.repeat(40));
    expect(result.success).toBe(false);
  });
});

describe('hexSchema', () => {
  it('accepts valid hex', () => {
    const result = hexSchema.safeParse('0xdeadbeef');
    expect(result.success).toBe(true);
  });

  it('accepts empty hex', () => {
    const result = hexSchema.safeParse('0x');
    expect(result.success).toBe(true);
  });

  it('rejects missing 0x prefix', () => {
    const result = hexSchema.safeParse('deadbeef');
    expect(result.success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const result = hexSchema.safeParse('0xzzzz');
    expect(result.success).toBe(false);
  });
});

describe('bigintSchema', () => {
  it('transforms numeric string to bigint', () => {
    const result = bigintSchema.safeParse('123');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(123n);
  });

  it('transforms "0" to 0n', () => {
    const result = bigintSchema.safeParse('0');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(0n);
  });

  it('transforms negative numeric string to bigint', () => {
    const result = bigintSchema.safeParse('-42');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(-42n);
  });

  it('rejects non-numeric strings', () => {
    const result = bigintSchema.safeParse('abc');
    expect(result.success).toBe(false);
  });

  it('rejects non-string input', () => {
    const result = bigintSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});

describe('chainConfigInputSchema', () => {
  const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const OWNER = ('0x' + '1'.repeat(40)) as `0x${string}`;

  it('accepts the tunable-only subset (chainId only)', () => {
    const result = chainConfigInputSchema.safeParse({ chainId: 42 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ chainId: 42, arbitrum: {} });
  });

  it('accepts the tunable arbitrum fields and forwards them', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      arbitrum: {
        InitialChainOwner: OWNER,
        InitialArbOSVersion: 51,
        DataAvailabilityCommittee: true,
        MaxCodeSize: 24576,
        MaxInitCodeSize: 49152,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.arbitrum).toMatchObject({
        InitialChainOwner: OWNER,
        InitialArbOSVersion: 51,
        DataAvailabilityCommittee: true,
        MaxCodeSize: 24576,
        MaxInitCodeSize: 49152,
      });
    }
  });

  it('accepts a full ChainConfig pasted from genesis.json', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      homesteadBlock: 0,
      daoForkBlock: null,
      daoForkSupport: true,
      eip150Block: 0,
      eip150Hash: ZERO_HASH,
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      berlinBlock: 0,
      londonBlock: 0,
      clique: { period: 0, epoch: 0 },
      arbitrum: {
        EnableArbOS: true,
        AllowDebugPrecompiles: false,
        DataAvailabilityCommittee: false,
        InitialArbOSVersion: 51,
        InitialChainOwner: OWNER,
        GenesisBlockNum: 0,
        MaxCodeSize: 24576,
        MaxInitCodeSize: 49152,
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects EnableArbOS=false (Arbitrum chains require ArbOS enabled)', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      arbitrum: { EnableArbOS: false },
    });
    expect(result.success).toBe(false);
  });

  it('rejects AllowDebugPrecompiles=true (security gate)', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      arbitrum: { AllowDebugPrecompiles: true },
    });
    expect(result.success).toBe(false);
  });

  it('rejects GenesisBlockNum non-zero', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      arbitrum: { GenesisBlockNum: 5 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-zero L1 fork block (e.g. londonBlock=5)', () => {
    const result = chainConfigInputSchema.safeParse({ chainId: 42, londonBlock: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects clique with non-zero period', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      clique: { period: 1, epoch: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects daoForkSupport=false', () => {
    const result = chainConfigInputSchema.safeParse({ chainId: 42, daoForkSupport: false });
    expect(result.success).toBe(false);
  });

  it('rejects non-zero eip150Hash', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      eip150Hash: '0x' + '1'.repeat(64),
    });
    expect(result.success).toBe(false);
  });

  it('drops unknown top-level fields silently', () => {
    const result = chainConfigInputSchema.safeParse({ chainId: 42, futureField: 'whatever' });
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as Record<string, unknown>).futureField).toBeUndefined();
  });

  it('drops unknown arbitrum fields silently', () => {
    const result = chainConfigInputSchema.safeParse({
      chainId: 42,
      arbitrum: { InitialChainOwner: OWNER, FutureArbField: 1 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data.arbitrum as Record<string, unknown>).FutureArbField,
      ).toBeUndefined();
    }
  });

  it('rejects missing chainId', () => {
    const result = chainConfigInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('privateKeySchema', () => {
  it('accepts valid 66-char hex private key', () => {
    const result = privateKeySchema.safeParse('0x' + 'a'.repeat(64));
    expect(result.success).toBe(true);
  });

  it('rejects too-short key (63 hex chars after 0x)', () => {
    const result = privateKeySchema.safeParse('0x' + 'a'.repeat(63));
    expect(result.success).toBe(false);
  });

  it('rejects too-long key (65 hex chars after 0x)', () => {
    const result = privateKeySchema.safeParse('0x' + 'a'.repeat(65));
    expect(result.success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const result = privateKeySchema.safeParse('0x' + 'z'.repeat(64));
    expect(result.success).toBe(false);
  });
});
