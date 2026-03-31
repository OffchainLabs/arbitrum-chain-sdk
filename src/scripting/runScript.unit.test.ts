import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { runScript } from './runScript';

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
  stdoutData = '';
  stderrData = '';

  vi.spyOn(process.stdout, 'write').mockImplementation((data: string | Uint8Array) => {
    stdoutData += data.toString();
    return true;
  });

  vi.spyOn(process.stderr, 'write').mockImplementation((data: string | Uint8Array) => {
    stderrData += data.toString();
    return true;
  });

  vi.spyOn(process, 'exit').mockImplementation((() => {
    // intentionally empty -- just prevents the real exit
  }) as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function getExitCode(): number | undefined {
  const calls = (process.exit as any).mock?.calls;
  if (calls && calls.length > 0) {
    return calls[calls.length - 1][0];
  }
  return undefined;
}

it('parses JSON from argv and writes result to stdout', async () => {
  process.argv[2] = '{"x": 5}';
  runScript({
    input: z.object({ x: z.number() }),
    run: async (input) => ({ doubled: input.x * 2 }),
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(JSON.parse(stdoutData)).toEqual({ doubled: 10 });
  expect(getExitCode()).toBeUndefined();
});

it('exits with code 1 when no JSON argument provided', () => {
  process.argv[2] = undefined as any;
  runScript({
    input: z.object({}),
    run: async () => ({}),
  });

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('Usage');
});

it('exits with code 1 for invalid JSON', () => {
  process.argv[2] = 'not json';
  runScript({
    input: z.object({}),
    run: async () => ({}),
  });

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('Unexpected token');
});

it('prints validation errors to stderr on schema failure', async () => {
  process.argv[2] = '{"name": 123}';
  runScript({
    input: z.object({ name: z.string() }),
    run: async (input) => input,
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('validation failed');
});

it('serializes bigint values as strings', async () => {
  process.argv[2] = '{}';
  runScript({
    input: z.object({}),
    run: async () => ({ value: BigInt('123456789012345678901234567890') }),
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  const parsed = JSON.parse(stdoutData);
  expect(parsed.value).toBe('123456789012345678901234567890');
});

it('prints run errors to stderr', async () => {
  process.argv[2] = '{}';
  runScript({
    input: z.object({}),
    run: async () => {
      throw new Error('something broke');
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('something broke');
  expect(stderrData).toContain('at');
});
