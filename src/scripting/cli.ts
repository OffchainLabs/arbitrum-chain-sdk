import { runCli } from './scriptUtils';
import { commands } from './commands';

runCli(
  'chain-sdk',
  Object.fromEntries(
    commands.map(({ name, schema, func }) => [
      name,
      { input: schema, run: (parsed: unknown) => func(...(parsed as readonly unknown[])) },
    ]),
  ),
);
