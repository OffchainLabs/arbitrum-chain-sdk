import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { runScript, runCli, cmd } from './scriptUtils';

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
  }) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function getExitCode(): number | undefined {
  const calls = (process.exit as unknown as { mock?: { calls: number[][] } }).mock?.calls;
  if (calls && calls.length > 0) {
    return calls[calls.length - 1][0];
  }
  return undefined;
}

it('parses JSON from argv and writes result to stdout', async () => {
  process.argv[2] = '{"x": 5}';
  runScript(z.object({ x: z.number() }), async (input) => ({ doubled: input.x * 2 }));

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(JSON.parse(stdoutData)).toEqual({ doubled: 10 });
  expect(getExitCode()).toBeUndefined();
});

it('exits with code 1 when no JSON argument provided', () => {
  process.argv[2] = undefined as unknown as string;
  runScript(z.object({}), async () => ({}));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('JSON string expected');
});

it('exits with code 1 for invalid JSON', () => {
  process.argv[2] = 'not json';
  runScript(z.object({}), async () => ({}));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('Unexpected token');
});

it('prints validation errors to stderr on schema failure', async () => {
  process.argv[2] = '{"name": 123}';
  runScript(z.object({ name: z.string() }), async (input) => input);

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('validation failed');
});

it('serializes bigint values as strings', async () => {
  process.argv[2] = '{}';
  runScript(z.object({}), async () => ({ value: BigInt('123456789012345678901234567890') }));

  await new Promise((resolve) => setTimeout(resolve, 10));

  const parsed = JSON.parse(stdoutData);
  expect(parsed.value).toBe('123456789012345678901234567890');
});

it('prints run errors to stderr', async () => {
  process.argv[2] = '{}';
  runScript(z.object({}), async () => {
    throw new Error('something broke');
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('something broke');
  expect(stderrData).toContain('at');
});

it('outputs raw string without JSON quotes', async () => {
  process.argv[2] = '{}';
  runScript(z.object({}), async () => 'hello world');

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(stdoutData).toBe('hello world\n');
  expect(getExitCode()).toBeUndefined();
});

describe('runCli', () => {
  const testSchema = z.object({ value: z.string() });
  const testCommands = {
    echo: cmd(
      testSchema.transform((input) => [input]),
      (input: { value: string }) => input,
    ),
  };

  it('prints usage and exits 1 for unknown command', () => {
    process.argv[2] = 'nope';
    process.argv[3] = '{}';
    runCli('test-cli', testCommands);

    expect(getExitCode()).toBe(1);
    expect(stderrData).toContain('Usage');
    expect(stderrData).toContain('echo');
  });

  it('prints usage and exits 1 when JSON arg is missing', () => {
    process.argv[2] = 'echo';
    process.argv[3] = undefined as unknown as string;
    runCli('test-cli', testCommands);

    expect(getExitCode()).toBe(1);
    expect(stderrData).toContain('Usage');
  });

  it('prints parse error and exits 1 for invalid JSON', () => {
    process.argv[2] = 'echo';
    process.argv[3] = 'not json';
    runCli('test-cli', testCommands);

    expect(getExitCode()).toBe(1);
    expect(stderrData).toContain('Unexpected token');
  });

  it('prints validation error and exits 1 on schema failure', async () => {
    process.argv[2] = 'echo';
    process.argv[3] = '{"value": 123}';
    runCli('test-cli', testCommands);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(getExitCode()).toBe(1);
    expect(stderrData).toContain('validation failed');
  });

  it('calls the command and writes result to stdout', async () => {
    process.argv[2] = 'echo';
    process.argv[3] = '{"value": "hi"}';
    runCli('test-cli', testCommands);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(JSON.parse(stdoutData)).toEqual({ value: 'hi' });
    expect(getExitCode()).toBeUndefined();
  });

  it('outputs raw string without JSON quotes', async () => {
    const stringCommands = {
      greet: cmd(
        z.object({}).transform((input) => [input]),
        () => 'hello world',
      ),
    };
    process.argv[2] = 'greet';
    process.argv[3] = '{}';
    runCli('test-cli', stringCommands);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(stdoutData).toBe('hello world\n');
    expect(getExitCode()).toBeUndefined();
  });
});
