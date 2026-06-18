import { readFileSync, writeFileSync } from 'node:fs';

import { z, ZodError, ZodType } from 'zod';
import { parse as parseJsonc, ParseError, printParseErrorCode } from 'jsonc-parser';

function readStdin(): string {
  return readFileSync(0, 'utf8');
}

function resolveInputArg(arg: string): string {
  if (arg === '-') return readStdin();
  if (arg.startsWith('@')) return readFileSync(arg.slice(1), 'utf8');
  return arg;
}

function findOutputPath(args: string[]): string | undefined {
  const i = args.indexOf('-o');
  if (i === -1) return undefined;
  const value = args[i + 1];
  if (value === undefined || value === '') throw new Error('Missing value for -o flag');
  return value;
}

function writeOutput(content: string, outputPath: string | undefined): void {
  if (outputPath !== undefined) {
    writeFileSync(outputPath, content);
  } else {
    process.stdout.write(content);
  }
}

function parseInput(text: string): unknown {
  const errors: ParseError[] = [];
  const result = parseJsonc(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });
  if (errors.length > 0) {
    const first = errors[0];
    throw new SyntaxError(
      `Parse error: ${printParseErrorCode(first.error)} at offset ${first.offset}`,
    );
  }
  return result;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    const stack = error.stack ?? error.message;
    if (error instanceof ZodError) {
      return `Input validation failed:\n${error.message}`;
    }
    return stack;
  }
  return `Non-Error value thrown: ${JSON.stringify(error)}`;
}

const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v);

function handleError(error: unknown): never {
  process.stderr.write(formatError(error) + '\n');
  process.exit(1);
}

export function runScript<TSchema extends ZodType>(
  schema: TSchema,
  run: (input: z.output<TSchema>) => unknown,
): void {
  // Keep stdout reserved for the JSON result; route any SDK progress logs to stderr.
  console.log = console.error.bind(console);

  const jsonString = process.argv[2];

  if (!jsonString) {
    process.stderr.write(`Usage: ${process.argv[1] ?? 'script'} '<json>'\n`);
    return process.exit(1);
  }

  let rawInput: unknown;
  let outputPath: string | undefined;
  try {
    rawInput = parseInput(resolveInputArg(jsonString));
    outputPath = findOutputPath(process.argv.slice(3));
  } catch (error) {
    return handleError(error);
  }

  (async () => {
    const parsed = schema.parse(rawInput);
    const result = await run(parsed);
    const output = typeof result === 'string' ? result : JSON.stringify(result, replacer, 2);
    writeOutput(output + '\n', outputPath);
  })().catch(handleError);
}

export type CliCommand = {
  name: string;
  schema: ZodType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: (...args: any[]) => unknown;
};

export function runCli(cliName: string, commands: readonly CliCommand[]): void {
  // Keep stdout reserved for the JSON result; route any SDK progress logs to stderr.
  console.log = console.error.bind(console);

  const name = process.argv[2];
  const command = commands.find((c) => c.name === name);

  if (!command) {
    const available = commands.map((c) => c.name).join(', ');
    process.stderr.write(`Usage: ${cliName} <command> '<json>'\nCommands: ${available}\n`);
    return process.exit(1);
  }

  let outputPath: string | undefined;
  try {
    outputPath = findOutputPath(process.argv.slice(3));
  } catch (error) {
    handleError(error);
  }

  if (process.argv[3] === '--schema') {
    const jsonSchema = z.toJSONSchema(command.schema, { io: 'input', unrepresentable: 'any' });
    writeOutput(JSON.stringify(jsonSchema, null, 2) + '\n', outputPath);
    process.exit(0);
  }

  const jsonString = process.argv[3];

  if (!jsonString) {
    process.stderr.write(`Usage: ${cliName} ${name} '<json>'\n`);
    return process.exit(1);
  }

  let rawInput: unknown;
  try {
    rawInput = parseInput(resolveInputArg(jsonString));
  } catch (error) {
    return handleError(error);
  }

  (async () => {
    const parsed = command.schema.parse(rawInput);
    const args = Array.isArray(parsed) ? parsed : [parsed];
    const result = await command.func(...args);
    const output = typeof result === 'string' ? result : JSON.stringify(result, replacer, 2);
    writeOutput(output + '\n', outputPath);
  })().catch(handleError);
}
