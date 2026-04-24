import { runCli, cmd } from './scriptUtils';
import { registry } from './registry';

runCli(
  'chain-sdk',
  Object.fromEntries(registry.map(({ name, schema, func }) => [name, cmd(schema, func)])),
);
