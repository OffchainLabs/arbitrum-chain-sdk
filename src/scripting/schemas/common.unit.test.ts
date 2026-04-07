import { describe, it, expect } from 'vitest';
import { addressSchema, hexSchema, bigintSchema, privateKeySchema } from './common';

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

  it('transforms numeric input to bigint', () => {
    const result = bigintSchema.safeParse(123);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(123n);
  });

  // z.coerce.bigint() calls BigInt() which throws on invalid input
  // rather than returning a ZodError through safeParse
  it('throws on non-numeric strings', () => {
    expect(() => bigintSchema.safeParse('abc')).toThrow();
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
