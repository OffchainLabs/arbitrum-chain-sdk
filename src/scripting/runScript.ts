import { z, ZodError, ZodType } from 'zod';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    const stack = error.stack ?? error.message;
    if (error instanceof ZodError) {
      return `Input validation failed:\n${error.message}\n${stack}`;
    }
    return stack;
  }
  return `Non-Error value thrown: ${JSON.stringify(error)}`;
}

export function runScript<TSchema extends ZodType, TOutput>({
  input,
  run,
}: {
  input: TSchema;
  run: (input: z.output<TSchema>) => Promise<TOutput>;
}): void {
  const jsonString = process.argv[2];

  if (!jsonString) {
    process.stderr.write("Usage: npx tsx <script> '<json>'\n");
    process.exit(1);
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(jsonString);
  } catch (error) {
    process.stderr.write(formatError(error) + '\n');
    process.exit(1);
  }

  Promise.resolve()
    .then(() => input.parse(rawInput))
    .then((parsed) => run(parsed))
    .then((result) => {
      const replacer = (_k: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v);
      process.stdout.write(JSON.stringify(result, replacer, 2) + '\n');
    })
    .catch((error) => {
      process.stderr.write(formatError(error) + '\n');
      process.exit(1);
    });
}
