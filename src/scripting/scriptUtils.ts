import { z, ZodError, ZodType } from 'zod';

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
  const jsonString = process.argv[2];

  if (!jsonString) {
    process.stderr.write(`Usage: ${process.argv[1] ?? 'script'} '<json>'\n`);
    return process.exit(1);
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(jsonString);
  } catch (error) {
    return handleError(error);
  }

  (async () => {
    const parsed = schema.parse(rawInput);
    const result = await run(parsed);
    const output = typeof result === 'string' ? result : JSON.stringify(result, replacer, 2);
    process.stdout.write(output + '\n');
  })().catch(handleError);
}

export type CliCommand = {
  name: string;
  schema: ZodType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: (...args: any[]) => unknown;
};

export function runCli(cliName: string, commands: readonly CliCommand[]): void {
  const name = process.argv[2];
  const command = commands.find((c) => c.name === name);

  if (!command) {
    const available = commands.map((c) => c.name).join(', ');
    process.stderr.write(`Usage: ${cliName} <command> '<json>'\nCommands: ${available}\n`);
    return process.exit(1);
  }

  const jsonString = process.argv[3];

  if (!jsonString) {
    process.stderr.write(`Usage: ${cliName} ${name} '<json>'\n`);
    return process.exit(1);
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(jsonString);
  } catch (error) {
    return handleError(error);
  }

  (async () => {
    const parsed = command.schema.parse(rawInput);
    const args = Array.isArray(parsed) ? parsed : [parsed];
    const result = await command.func(...args);
    const output = typeof result === 'string' ? result : JSON.stringify(result, replacer, 2);
    process.stdout.write(output + '\n');
  })().catch(handleError);
}
