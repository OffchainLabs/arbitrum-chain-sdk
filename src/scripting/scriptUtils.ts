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
    process.stderr.write('JSON string expected as the first argument.\n');
    process.exit(1);
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(jsonString);
  } catch (error) {
    handleError(error);
  }

  (async () => {
    const parsed = schema.parse(rawInput);
    const result = await run(parsed);
    const output = typeof result === 'string' ? result : JSON.stringify(result, replacer, 2);
    process.stdout.write(output + '\n');
  })().catch(handleError);
}

export function cmd<TSchema extends ZodType<readonly unknown[]>>(
  input: TSchema,
  run: (...args: z.output<TSchema>) => unknown,
) {
  return {
    input,
    run: (parsed: unknown) => run(...(parsed as z.output<TSchema>)),
  };
}

export function workflow<TSchema extends ZodType>(
  input: TSchema,
  run: (input: z.output<TSchema>) => unknown,
) {
  return { input, run: (parsed: unknown) => run(parsed as z.output<TSchema>) };
}

export function runCli(
  cliName: string,
  commands: Record<string, { input: ZodType; run: (parsed: unknown) => unknown }>,
): void {
  const name = process.argv[2];
  const command = name ? commands[name] : undefined;

  if (!command) {
    const available = Object.keys(commands).join(', ');
    process.stderr.write(`Usage: ${cliName} <command> '<json>'\nCommands: ${available}\n`);
    process.exit(1);
  }

  const jsonString = process.argv[3];

  if (!jsonString) {
    process.stderr.write(`Usage: ${cliName} ${name} '<json>'\n`);
    process.exit(1);
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(jsonString);
  } catch (error) {
    handleError(error);
  }

  (async () => {
    const parsed = command.input.parse(rawInput);
    const result = await command.run(parsed);
    const output = typeof result === 'string' ? result : JSON.stringify(result, replacer, 2);
    process.stdout.write(output + '\n');
  })().catch(handleError);
}
