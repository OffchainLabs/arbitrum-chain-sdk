import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { runScript, runCli, cmd } from './scriptUtils';

let stdinText: string | undefined;
let filesByPath: Record<string, string> = {};
let filesWritten: Record<string, string> = {};
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((pathOrFd: number | string) => {
    if (pathOrFd === 0) {
      if (stdinText === undefined) throw new Error('stdinText not set in test');
      return stdinText;
    }
    const content = filesByPath[pathOrFd as string];
    if (content === undefined) throw new Error(`ENOENT: mock file ${pathOrFd}`);
    return content;
  }),
  writeFileSync: vi.fn((path: string, content: string) => {
    filesWritten[path] = content;
  }),
}));

let stdoutData: string;
let stderrData: string;

beforeEach(() => {
  stdoutData = '';
  stderrData = '';
  stdinText = undefined;
  filesByPath = {};
  filesWritten = {};
  // Clear any argv tail set by a previous test so -o from one test doesn't bleed into another.
  process.argv.length = 2;

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
  expect(stderrData).toContain('Parse error');
});

it('writes the result to a file when -o is provided', async () => {
  process.argv[2] = '{"x": 3}';
  process.argv[3] = '-o';
  process.argv[4] = '/out/result.json';
  runScript(z.object({ x: z.number() }), async (input) => ({ cubed: input.x ** 3 }));

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(stdoutData).toBe('');
  expect(JSON.parse(filesWritten['/out/result.json'])).toEqual({ cubed: 27 });
  expect(getExitCode()).toBeUndefined();
});

it('exits with code 1 when -o has no value', () => {
  process.argv[2] = '{}';
  process.argv[3] = '-o';
  process.argv[4] = undefined as unknown as string;
  runScript(z.object({}), async () => ({}));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('Missing value for -o');
});

it('reads JSON from a file when argv starts with "@"', async () => {
  process.argv[2] = '@/etc/chain/config.json';
  filesByPath['/etc/chain/config.json'] = '{"x": 4}';
  runScript(z.object({ x: z.number() }), async (input) => ({ squared: input.x * input.x }));

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(JSON.parse(stdoutData)).toEqual({ squared: 16 });
  expect(getExitCode()).toBeUndefined();
});

it('exits with code 1 when the @file path does not exist', () => {
  process.argv[2] = '@/nope.json';
  runScript(z.object({}), async () => ({}));

  expect(getExitCode()).toBe(1);
  expect(stderrData).toContain('ENOENT');
});

it('reads JSON from stdin when argv is "-"', async () => {
  process.argv[2] = '-';
  stdinText = '{"x": 7}';
  runScript(z.object({ x: z.number() }), async (input) => ({ tripled: input.x * 3 }));

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(JSON.parse(stdoutData)).toEqual({ tripled: 21 });
  expect(getExitCode()).toBeUndefined();
});

it('routes console.log to stderr so stdout stays reserved for the result', async () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  process.argv[2] = '{}';
  runScript(z.object({}), async () => {
    console.log('progress message');
    return { ok: true };
  });

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(JSON.parse(stdoutData)).toEqual({ ok: true });
  expect(errorSpy).toHaveBeenCalledWith('progress message');
});

it('accepts JSONC input with comments and trailing commas', async () => {
  process.argv[2] = `{
    // line comment
    "x": 5, /* inline block comment */
    "y": [1, 2, 3,],
  }`;
  runScript(z.object({ x: z.number(), y: z.array(z.number()) }), async (input) => ({
    sum: input.x + input.y.reduce((a, b) => a + b, 0),
  }));

  await new Promise((resolve) => setTimeout(resolve, 10));

  expect(JSON.parse(stdoutData)).toEqual({ sum: 11 });
  expect(getExitCode()).toBeUndefined();
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
    expect(stderrData).toContain('Parse error');
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

  it('writes the command result to a file when -o is provided', async () => {
    process.argv[2] = 'echo';
    process.argv[3] = '{"value": "hi"}';
    process.argv[4] = '-o';
    process.argv[5] = '/out/result.json';
    runCli('test-cli', testCommands);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(stdoutData).toBe('');
    expect(JSON.parse(filesWritten['/out/result.json'])).toEqual({ value: 'hi' });
    expect(getExitCode()).toBeUndefined();
  });

  it('writes the schema to a file when --schema is combined with -o', () => {
    process.argv[2] = 'echo';
    process.argv[3] = '--schema';
    process.argv[4] = '-o';
    process.argv[5] = '/out/schema.json';
    runCli('test-cli', testCommands);

    expect(stdoutData).toBe('');
    expect(filesWritten['/out/schema.json']).toContain('"type"');
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
